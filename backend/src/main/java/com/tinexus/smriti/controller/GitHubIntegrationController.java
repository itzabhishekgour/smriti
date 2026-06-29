package com.tinexus.smriti.controller;

import com.tinexus.smriti.model.GitHubIntegration;
import com.tinexus.smriti.repository.GitHubIntegrationRepository;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.service.GitHubIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/integrations/github")
@RequiredArgsConstructor
public class GitHubIntegrationController {

    private final GitHubIntegrationService gitHubIntegrationService;
    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getIntegrationStatus(@PathVariable("projectId") UUID projectId) {
        return gitHubIntegrationRepository.findByProjectId(projectId)
                .map(integration -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("connected", true);
                    response.put("repoOwner", integration.getRepoOwner());
                    response.put("repoName", integration.getRepoName());
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
        String repoOwner = request.get("repoOwner");
        String repoName = request.get("repoName");
        String accessToken = request.get("accessToken");

        gitHubIntegrationService.connectRepository(projectId, repoOwner, repoName, accessToken, user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncSecrets(
            @PathVariable("projectId") UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = authService.getCurrentUser(userDetails.getUsername());
        Map<String, Object> result = gitHubIntegrationService.syncSecretsToGitHub(projectId, user.getId());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping
    public ResponseEntity<Void> disconnectIntegration(
            @PathVariable("projectId") UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = authService.getCurrentUser(userDetails.getUsername());
        gitHubIntegrationService.disconnectRepository(projectId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
