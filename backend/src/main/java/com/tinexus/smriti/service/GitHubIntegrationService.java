package com.tinexus.smriti.service;

import com.goterl.lazysodium.LazySodiumJava;
import com.goterl.lazysodium.SodiumJava;
import com.goterl.lazysodium.interfaces.Box;
import com.goterl.lazysodium.utils.Key;
import com.tinexus.smriti.model.*;
import com.tinexus.smriti.repository.GitHubIntegrationRepository;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.SecretRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubIntegrationService {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final ProjectRepository projectRepository;
    private final SecretRepository secretRepository;
    private final EncryptionService encryptionService;
    private final AuditLogService auditLogService;
    private final com.tinexus.smriti.repository.GitHubAccountConnectionRepository gitHubAccountConnectionRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public GitHubIntegration connectRepository(UUID projectId, String repoOwner, String repoName, String accessToken, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        String finalToken = accessToken;
        if (finalToken == null || finalToken.trim().isEmpty()) {
            GitHubAccountConnection connection = gitHubAccountConnectionRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalArgumentException("No GitHub account connected and no PAT provided"));
            finalToken = encryptionService.decrypt(connection.getEncryptedAccessToken());
        }

        // Validate the access token by attempting to fetch the public key
        fetchPublicKey(repoOwner, repoName, finalToken);

        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElse(new GitHubIntegration());

        integration.setProject(project);
        integration.setRepoOwner(repoOwner);
        integration.setRepoName(repoName);
        integration.setEncryptedAccessToken(encryptionService.encrypt(finalToken));

        GitHubIntegration saved = gitHubIntegrationRepository.save(integration);
        return saved;
    }

    @Transactional
    public void disconnectRepository(UUID projectId, UUID userId) {
        gitHubIntegrationRepository.findByProjectId(projectId)
                .ifPresent(gitHubIntegrationRepository::delete);
    }

    @Transactional
    public Map<String, Object> syncSecretsToGitHub(UUID projectId, UUID userId) {
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new IllegalStateException("GitHub integration not found for this project"));

        String accessToken = encryptionService.decrypt(integration.getEncryptedAccessToken());
        
        // Fetch Public Key
        Map<String, String> publicKeyData = fetchPublicKey(integration.getRepoOwner(), integration.getRepoName(), accessToken);
        String keyId = publicKeyData.get("key_id");
        String publicKeyBase64 = publicKeyData.get("key");

        List<Secret> secrets = secretRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        
        LazySodiumJava lazySodium = new LazySodiumJava(new SodiumJava());
        
        int synced = 0;
        List<String> skipped = new ArrayList<>();

        for (Secret secret : secrets) {
            String githubSecretName = sanitizeSecretName(secret.getName());
            if (githubSecretName == null) {
                skipped.add(secret.getName() + " - Cannot be sanitized to a valid GitHub secret name");
                continue;
            }

            try {
                String decryptedValue = encryptionService.decrypt(secret.getEncryptedValue());
                String encryptedValueForGithub = encryptForGitHub(lazySodium, decryptedValue, publicKeyBase64);
                pushSecretToGitHub(integration.getRepoOwner(), integration.getRepoName(), accessToken, githubSecretName, encryptedValueForGithub, keyId);
                synced++;
            } catch (Exception e) {
                log.error("Failed to sync secret " + secret.getName(), e);
                skipped.add(secret.getName() + " - " + e.getMessage());
            }
        }

        integration.setLastSyncedAt(LocalDateTime.now());
        gitHubIntegrationRepository.save(integration);

        auditLogService.log(
                userId,
                ActionType.GITHUB_SECRETS_SYNCED,
                "PROJECT",
                projectId,
                integration.getRepoOwner() + "/" + integration.getRepoName(),
                projectId,
                "{\"synced\": " + synced + ", \"skipped\": " + skipped.size() + "}"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("synced", synced);
        result.put("skipped", skipped);
        return result;
    }

    private Map<String, String> fetchPublicKey(String owner, String repo, String token) {
        String url = String.format("https://api.github.com/repos/%s/%s/actions/secrets/public-key", owner, repo);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (Map<String, String>) response.getBody();
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            throw new IllegalArgumentException("GitHub API Error: " + e.getStatusCode() + ". Please verify your Repo Owner, Repo Name, and PAT.");
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to connect to GitHub: " + e.getMessage());
        }
        
        throw new IllegalArgumentException("Failed to fetch GitHub repository public key.");
    }

    private void pushSecretToGitHub(String owner, String repo, String token, String secretName, String encryptedValue, String keyId) {
        String url = String.format("https://api.github.com/repos/%s/%s/actions/secrets/%s", owner, repo, secretName);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        
        Map<String, String> body = new HashMap<>();
        body.put("encrypted_value", encryptedValue);
        body.put("key_id", keyId);
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
        
        ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.PUT, request, Void.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to push secret to GitHub: " + response.getStatusCode());
        }
    }

    private String encryptForGitHub(LazySodiumJava lazySodium, String plaintext, String publicKeyBase64) {
        byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
        byte[] messageBytes = plaintext.getBytes(StandardCharsets.UTF_8);
        
        byte[] ciphertextBytes = new byte[messageBytes.length + Box.SEALBYTES];
        
        boolean success = lazySodium.cryptoBoxSeal(ciphertextBytes, messageBytes, messageBytes.length, publicKeyBytes);
        if (!success) {
            throw new RuntimeException("Libsodium sealed box encryption failed");
        }
        
        return Base64.getEncoder().encodeToString(ciphertextBytes);
    }

    private String sanitizeSecretName(String name) {
        if (name == null || name.isBlank()) return null;
        
        // GitHub secrets must be alphanumeric and underscores
        String sanitized = name.replaceAll("[^a-zA-Z0-9_]", "_");
        
        // Cannot start with a number, if so, prefix with "SMRITI_"
        if (sanitized.matches("^[0-9].*")) {
            sanitized = "SMRITI_" + sanitized;
        }
        
        // Cannot start with GITHUB_
        if (sanitized.toUpperCase().startsWith("GITHUB_")) {
            sanitized = "SMRITI_" + sanitized;
        }
        
        return sanitized;
    }
}
