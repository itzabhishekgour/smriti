package com.tinexus.smriti.service;

import com.tinexus.smriti.model.*;
import com.tinexus.smriti.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecretScanningService {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final SecretRepository secretRepository;
    private final SecretScanFindingRepository findingRepository;
    private final EncryptionService encryptionService;
    private final AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();

    // Regex patterns based on common secret formats
    private static final Map<String, Pattern> SECRET_PATTERNS = new HashMap<>();
    static {
        SECRET_PATTERNS.put("AWS_ACCESS_KEY_ID", Pattern.compile("(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"));
        SECRET_PATTERNS.put("GITHUB_TOKEN", Pattern.compile("gh[pousr]_[a-zA-Z0-9]{36}"));
        SECRET_PATTERNS.put("STRIPE_KEY", Pattern.compile("(?:sk_live|rk_live)_[a-zA-Z0-9]{24,99}"));
        SECRET_PATTERNS.put("PRIVATE_KEY", Pattern.compile("-----BEGIN [A-Z ]+ PRIVATE KEY-----"));
        SECRET_PATTERNS.put("GENERIC_SECRET", Pattern.compile("(?i)(password|secret|token|api_key|apikey)[\\s]*[:=][\\s]*['\"][a-zA-Z0-9\\-_]{16,}['\"]"));
    }

    /**
     * Scheduled daily scan at 2:00 AM server time.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void scheduledScanAllRepositories() {
        log.info("Starting scheduled secret scan for all GitHub integrations...");
        List<GitHubIntegration> integrations = gitHubIntegrationRepository.findAll();
        for (GitHubIntegration integration : integrations) {
            try {
                scanRepository(integration);
            } catch (Exception e) {
                log.error("Failed to scan repository " + integration.getRepoOwner() + "/" + integration.getRepoName(), e);
            }
        }
        log.info("Completed scheduled secret scan.");
    }

    @Transactional
    public void scanProjectRepository(UUID projectId) {
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new IllegalArgumentException("No GitHub integration found for this project."));
        scanRepository(integration);
    }

    private void scanRepository(GitHubIntegration integration) {
        Project project = integration.getProject();
        String accessToken = encryptionService.decrypt(integration.getEncryptedAccessToken());
        String owner = integration.getRepoOwner();
        String repo = integration.getRepoName();

        // 1. Fetch default branch tree
        String treeUrl = String.format("https://api.github.com/repos/%s/%s/git/trees/HEAD?recursive=1", owner, repo);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        HttpEntity<Void> request = new HttpEntity<>(headers);

        Map<String, Object> treeResponse;
        try {
            ResponseEntity<Map> response = restTemplate.exchange(treeUrl, HttpMethod.GET, request, Map.class);
            treeResponse = response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch tree for {}/{}", owner, repo, e);
            return;
        }

        if (treeResponse == null || !treeResponse.containsKey("tree")) return;

        List<Map<String, Object>> tree = (List<Map<String, Object>>) treeResponse.get("tree");

        // 2. Load exact secrets for the project to find EXACT_MATCH
        List<Secret> secrets = secretRepository.findByProjectIdOrderByCreatedAtDesc(project.getId());
        List<String> decryptedSecretValues = secrets.stream()
                .map(s -> encryptionService.decrypt(s.getEncryptedValue()))
                .filter(val -> val.length() > 5) // Ignore very short secrets to prevent false positives
                .collect(Collectors.toList());

        int findingsCount = 0;
        Set<String> existingFindings = findingRepository.findByProjectOrderByDetectedAtDesc(project)
                .stream()
                .map(f -> f.getFilePath() + ":" + f.getMaskedValue())
                .collect(Collectors.toSet());

        // 3. Scan each blob (file)
        for (Map<String, Object> item : tree) {
            String type = (String) item.get("type");
            if (!"blob".equals(type)) continue;

            String path = (String) item.get("path");
            String url = (String) item.get("url");

            // Skip common binary/asset files
            if (path.matches("(?i).*\\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|mp4|webm)$")) continue;

            String content = fetchBlobContent(url, accessToken);
            if (content == null || content.isEmpty()) continue;

            // Check exact matches
            for (String secretValue : decryptedSecretValues) {
                if (content.contains(secretValue)) {
                    String masked = maskSecret(secretValue);
                    String key = path + ":" + masked;
                    if (!existingFindings.contains(key)) {
                        createFinding(project, path, masked, SecretScanFinding.MatchType.EXACT_MATCH, SecretScanFinding.ConfidenceLevel.HIGH);
                        existingFindings.add(key);
                        findingsCount++;
                    }
                }
            }

            // Check regex patterns
            for (Map.Entry<String, Pattern> entry : SECRET_PATTERNS.entrySet()) {
                Matcher matcher = entry.getValue().matcher(content);
                while (matcher.find()) {
                    String matchedValue = matcher.group();
                    // Avoid duplicating if we already caught it as an exact match
                    boolean isAlsoExact = decryptedSecretValues.stream().anyMatch(matchedValue::contains);
                    if (isAlsoExact) continue;

                    String masked = maskSecret(matchedValue);
                    String key = path + ":" + masked;
                    if (!existingFindings.contains(key)) {
                        createFinding(project, path, masked, SecretScanFinding.MatchType.PATTERN_MATCH, SecretScanFinding.ConfidenceLevel.LOW);
                        existingFindings.add(key);
                        findingsCount++;
                    }
                }
            }
        }

        auditLogService.log(
                null, // System action
                ActionType.SECRET_SCAN_COMPLETED,
                "PROJECT",
                project.getId(),
                owner + "/" + repo,
                project.getId(),
                "{\"findings\": " + findingsCount + "}"
        );
    }

    private String fetchBlobContent(String blobUrl, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept", "application/vnd.github.v3+json");
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(blobUrl, HttpMethod.GET, request, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && "base64".equals(body.get("encoding"))) {
                String base64Content = (String) body.get("content");
                if (base64Content != null) {
                    return new String(Base64.getMimeDecoder().decode(base64Content));
                }
            }
        } catch (Exception e) {
            log.debug("Failed to fetch blob " + blobUrl, e);
        }
        return null;
    }

    private String maskSecret(String secret) {
        if (secret == null || secret.length() < 4) return "****";
        if (secret.length() < 8) return secret.substring(0, 2) + "****";
        return secret.substring(0, 4) + "****" + secret.substring(secret.length() - 4);
    }

    private void createFinding(Project project, String path, String maskedValue, SecretScanFinding.MatchType matchType, SecretScanFinding.ConfidenceLevel confidence) {
        SecretScanFinding finding = new SecretScanFinding();
        finding.setProject(project);
        finding.setFilePath(path);
        finding.setMaskedValue(maskedValue);
        finding.setMatchType(matchType);
        finding.setConfidenceLevel(confidence);
        findingRepository.save(finding);
    }
}
