package com.tinexus.smriti.service;

import com.tinexus.smriti.model.*;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.RenderIntegrationRepository;
import com.tinexus.smriti.repository.SecretRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RenderIntegrationService {

    private final RenderIntegrationRepository renderIntegrationRepository;
    private final ProjectRepository projectRepository;
    private final SecretRepository secretRepository;
    private final EncryptionService encryptionService;
    private final AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RENDER_API_BASE = "https://api.render.com/v1";

    @Transactional
    public RenderIntegration connectService(UUID projectId, String serviceId, String apiKey, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Validate by fetching current env vars
        Map<String, String> currentEnvVars = fetchRenderEnvVars(serviceId, apiKey);
        
        // Try to fetch service details to get the name, but fallback if it fails
        String serviceName = serviceId;
        try {
            Map<String, Object> serviceDetails = fetchRenderServiceDetails(serviceId, apiKey);
            if (serviceDetails != null && serviceDetails.containsKey("name")) {
                serviceName = (String) serviceDetails.get("name");
            }
        } catch (Exception e) {
            log.warn("Could not fetch service details for {}, using ID as name", serviceId);
        }

        RenderIntegration integration = renderIntegrationRepository.findByProjectId(projectId)
                .orElse(new RenderIntegration());

        integration.setProject(project);
        integration.setServiceId(serviceId);
        integration.setServiceName(serviceName);
        integration.setEncryptedApiKey(encryptionService.encrypt(apiKey));

        return renderIntegrationRepository.save(integration);
    }

    @Transactional
    public void disconnectService(UUID projectId, UUID userId) {
        renderIntegrationRepository.findByProjectId(projectId)
                .ifPresent(renderIntegrationRepository::delete);
    }

    public Map<String, Object> previewSync(UUID projectId, UUID userId) {
        RenderIntegration integration = renderIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new IllegalStateException("Render integration not found for this project"));

        String apiKey = encryptionService.decrypt(integration.getEncryptedApiKey());
        
        Map<String, String> currentRenderVars = fetchRenderEnvVars(integration.getServiceId(), apiKey);
        List<Secret> smritiSecrets = secretRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        
        Map<String, String> smritiVars = new HashMap<>();
        for (Secret secret : smritiSecrets) {
            smritiVars.put(secret.getName(), encryptionService.decrypt(secret.getEncryptedValue()));
        }

        List<String> newKeys = new ArrayList<>();
        List<String> updatedKeys = new ArrayList<>();
        List<String> preservedKeys = new ArrayList<>();

        for (String smritiKey : smritiVars.keySet()) {
            if (currentRenderVars.containsKey(smritiKey)) {
                updatedKeys.add(smritiKey);
            } else {
                newKeys.add(smritiKey);
            }
        }

        for (String renderKey : currentRenderVars.keySet()) {
            if (!smritiVars.containsKey(renderKey)) {
                preservedKeys.add(renderKey);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("newKeys", newKeys);
        result.put("updatedKeys", updatedKeys);
        result.put("preservedKeys", preservedKeys);
        result.put("newCount", newKeys.size());
        result.put("updatedCount", updatedKeys.size());
        result.put("preservedCount", preservedKeys.size());
        return result;
    }

    @Transactional
    public Map<String, Object> syncSecretsToRender(UUID projectId, UUID userId) {
        RenderIntegration integration = renderIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new IllegalStateException("Render integration not found for this project"));

        String apiKey = encryptionService.decrypt(integration.getEncryptedApiKey());
        
        // 1. Fetch
        Map<String, String> currentRenderVars = fetchRenderEnvVars(integration.getServiceId(), apiKey);
        
        // 2. Merge
        List<Secret> smritiSecrets = secretRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        
        Map<String, String> mergedVars = new HashMap<>(currentRenderVars);
        int added = 0;
        int updated = 0;

        for (Secret secret : smritiSecrets) {
            String decryptedValue = encryptionService.decrypt(secret.getEncryptedValue());
            if (mergedVars.containsKey(secret.getName())) {
                updated++;
            } else {
                added++;
            }
            mergedVars.put(secret.getName(), decryptedValue);
        }
        
        int preserved = currentRenderVars.size() - updated;

        // 3. Push
        pushRenderEnvVars(integration.getServiceId(), apiKey, mergedVars);

        // Update sync time
        integration.setLastSyncedAt(LocalDateTime.now());
        renderIntegrationRepository.save(integration);

        // 4. Audit Log
        auditLogService.log(
                userId,
                ActionType.RENDER_SECRETS_SYNCED,
                "PROJECT",
                projectId,
                integration.getServiceName(),
                projectId,
                "{\"added\": " + added + ", \"updated\": " + updated + ", \"preserved\": " + preserved + "}"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("added", added);
        result.put("updated", updated);
        result.put("preserved", preserved);
        result.put("total", mergedVars.size());
        return result;
    }

    private Map<String, String> fetchRenderEnvVars(String serviceId, String apiKey) {
        String url = RENDER_API_BASE + "/services/" + serviceId + "/env-vars";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.set("Accept", "application/json");
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        try {
            // Render returns an array of objects: { "envVar": { "key": "...", "value": "..." } }
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            
            Map<String, String> envVars = new HashMap<>();
            if (response.getBody() != null) {
                for (Map<String, Object> item : response.getBody()) {
                    if (item.containsKey("envVar")) {
                        Map<String, String> envVar = (Map<String, String>) item.get("envVar");
                        envVars.put(envVar.get("key"), envVar.get("value"));
                    }
                }
            }
            return envVars;
        } catch (HttpClientErrorException e) {
            throw new IllegalArgumentException("Render API Error: " + e.getStatusCode() + ". Check your Service ID and API Key.");
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to fetch Render environment variables: " + e.getMessage());
        }
    }

    private Map<String, Object> fetchRenderServiceDetails(String serviceId, String apiKey) {
        String url = RENDER_API_BASE + "/services/" + serviceId;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.set("Accept", "application/json");
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.GET, request, new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        return response.getBody();
    }

    private void pushRenderEnvVars(String serviceId, String apiKey, Map<String, String> mergedVars) {
        String url = RENDER_API_BASE + "/services/" + serviceId + "/env-vars";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.set("Accept", "application/json");
        headers.set("Content-Type", "application/json");
        
        // Render expects an array of objects: [{ "key": "...", "value": "..." }]
        List<Map<String, String>> body = new ArrayList<>();
        for (Map.Entry<String, String> entry : mergedVars.entrySet()) {
            Map<String, String> varObj = new HashMap<>();
            varObj.put("key", entry.getKey());
            varObj.put("value", entry.getValue());
            body.add(varObj);
        }
        
        HttpEntity<List<Map<String, String>>> request = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<Void> response = restTemplate.exchange(url, HttpMethod.PUT, request, Void.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to push env vars to Render: " + response.getStatusCode());
            }
        } catch (HttpClientErrorException e) {
            throw new IllegalArgumentException("Render API Error on pushing variables: " + e.getStatusCode());
        }
    }
}
