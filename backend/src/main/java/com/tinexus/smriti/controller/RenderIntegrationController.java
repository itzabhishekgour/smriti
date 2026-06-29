package com.tinexus.smriti.controller;

import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.RenderIntegrationRepository;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.service.RenderIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/integrations/render")
@RequiredArgsConstructor
public class RenderIntegrationController {

    private final RenderIntegrationService renderIntegrationService;
    private final RenderIntegrationRepository renderIntegrationRepository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getIntegrationStatus(@PathVariable("projectId") UUID projectId) {
        return renderIntegrationRepository.findByProjectId(projectId)
                .map(integration -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("connected", true);
                    response.put("serviceId", integration.getServiceId());
                    response.put("serviceName", integration.getServiceName());
                    response.put("lastSyncedAt", integration.getLastSyncedAt());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("connected", false);
                    return ResponseEntity.ok(response);
                });
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> connectIntegration(
            @PathVariable("projectId") UUID projectId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = authService.getCurrentUser(userDetails.getUsername());
        String serviceId = request.get("serviceId");
        String apiKey = request.get("apiKey");

        renderIntegrationService.connectService(projectId, serviceId, apiKey, user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/preview-sync")
    public ResponseEntity<Map<String, Object>> previewSync(
            @PathVariable("projectId") UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = authService.getCurrentUser(userDetails.getUsername());
        Map<String, Object> result = renderIntegrationService.previewSync(projectId, user.getId());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncSecrets(
            @PathVariable("projectId") UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = authService.getCurrentUser(userDetails.getUsername());
        Map<String, Object> result = renderIntegrationService.syncSecretsToRender(projectId, user.getId());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping
    public ResponseEntity<Void> disconnectIntegration(
            @PathVariable("projectId") UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = authService.getCurrentUser(userDetails.getUsername());
        renderIntegrationService.disconnectService(projectId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
