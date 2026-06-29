package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.request.SecretCreateRequest;
import com.tinexus.smriti.dto.request.SecretUpdateRequest;
import com.tinexus.smriti.dto.response.SecretDetailResponse;
import com.tinexus.smriti.dto.response.SecretSummaryResponse;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.service.SecretService;
import com.tinexus.smriti.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SecretController {

    private final SecretService secretService;
    private final AuthService authService;

    /** All secrets across all user's projects — for dashboard */
    @GetMapping("/secrets")
    public ResponseEntity<ApiResponse<List<SecretSummaryResponse>>> getAllSecrets(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String q) {
        User user = resolveUser(userDetails);
        List<SecretSummaryResponse> secrets = (q != null && !q.isBlank())
                ? secretService.searchSecrets(user, q)
                : secretService.getAllSecrets(user);
        return ResponseEntity.ok(ApiResponse.success(secrets));
    }

    /** Secrets for a specific project */
    @GetMapping("/projects/{projectId}/secrets")
    public ResponseEntity<ApiResponse<List<SecretSummaryResponse>>> getByProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String q) {
        User user = resolveUser(userDetails);
        List<SecretSummaryResponse> secrets = (q != null && !q.isBlank())
                ? secretService.searchSecrets(user, q)
                : secretService.getSecretsByProject(projectId, user);
        return ResponseEntity.ok(ApiResponse.success(secrets));
    }

    /** Get full detail with decrypted value */
    @GetMapping("/projects/{projectId}/secrets/{secretId}")
    public ResponseEntity<ApiResponse<SecretDetailResponse>> getDetail(
            @PathVariable UUID projectId,
            @PathVariable UUID secretId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(
                ApiResponse.success(secretService.getSecretDetail(projectId, secretId, user)));
    }

    /** Export all secrets for a specific project (decrypted) */
    @GetMapping("/projects/{projectId}/secrets/export")
    public ResponseEntity<ApiResponse<List<SecretDetailResponse>>> exportProjectSecrets(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(secretService.exportSecrets(projectId, user)));
    }

    @PostMapping("/projects/{projectId}/secrets")
    public ResponseEntity<ApiResponse<SecretDetailResponse>> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody SecretCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Secret saved",
                        secretService.createSecret(projectId, request, user)));
    }

    @PostMapping("/projects/{projectId}/secrets/bulk")
    public ResponseEntity<ApiResponse<List<SecretSummaryResponse>>> createBulk(
            @PathVariable UUID projectId,
            @Valid @RequestBody List<SecretCreateRequest> requests,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Secrets bulk saved",
                        secretService.createBulkSecrets(projectId, requests, user)));
    }

    @PatchMapping("/projects/{projectId}/secrets/{secretId}")
    public ResponseEntity<ApiResponse<SecretDetailResponse>> update(
            @PathVariable UUID projectId,
            @PathVariable UUID secretId,
            @RequestBody SecretUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(
                ApiResponse.success("Secret updated",
                        secretService.updateSecret(projectId, secretId, request, user)));
    }

    @DeleteMapping("/projects/{projectId}/secrets/{secretId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID secretId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        secretService.deleteSecret(projectId, secretId, user);
        return ResponseEntity.ok(ApiResponse.success("Secret deleted", null));
    }

    @GetMapping("/projects/{projectId}/secrets/{secretId}/versions")
    public ResponseEntity<ApiResponse<List<com.tinexus.smriti.dto.response.SecretVersionResponse>>> getVersions(
            @PathVariable UUID projectId,
            @PathVariable UUID secretId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(
                secretService.getSecretVersions(projectId, secretId, user)));
    }

    @GetMapping("/projects/{projectId}/secrets/{secretId}/versions/{versionId}")
    public ResponseEntity<ApiResponse<String>> getVersionValue(
            @PathVariable UUID projectId,
            @PathVariable UUID secretId,
            @PathVariable UUID versionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success("Success",
                secretService.getSecretVersionValue(projectId, secretId, versionId, user)));
    }

    @PostMapping("/projects/{projectId}/secrets/{secretId}/versions/{versionId}/restore")
    public ResponseEntity<ApiResponse<SecretDetailResponse>> restoreVersion(
            @PathVariable UUID projectId,
            @PathVariable UUID secretId,
            @PathVariable UUID versionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success("Secret restored to previous version",
                secretService.rollbackToVersion(projectId, secretId, versionId, user)));
    }

    private User resolveUser(UserDetails userDetails) {
        return authService.getCurrentUser(userDetails.getUsername());
    }
}
