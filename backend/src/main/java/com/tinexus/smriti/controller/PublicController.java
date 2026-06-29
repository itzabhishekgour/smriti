package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.response.SecretDetailResponse;
import com.tinexus.smriti.model.ProjectLink;
import com.tinexus.smriti.service.ProjectLinkService;
import com.tinexus.smriti.service.SecretService;
import com.tinexus.smriti.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final ProjectLinkService projectLinkService;
    private final SecretService secretService;
    private final com.tinexus.smriti.service.AuditLogService auditLogService;

    @PostMapping("/links/{token}/access")
    public ResponseEntity<ApiResponse<Object>> accessSharedSecrets(
            @PathVariable String token,
            @RequestBody Map<String, String> request) {
        
        String password = request.get("password");
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        
        ProjectLink link = projectLinkService.verifyTokenAndPassword(token, password);
        String maskedEmail = projectLinkService.triggerOtp(link);
        
        if (maskedEmail != null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "REQUIRE_OTP",
                "maskedEmail", maskedEmail
            )));
        }

        // Backward compatibility: no email on link
        List<SecretDetailResponse> secrets = secretService.exportSecretsForLink(link.getProject().getId());
        auditLogService.log(null, com.tinexus.smriti.model.ActionType.MAGIC_LINK_ACCESSED, "MAGIC_LINK", link.getId(), "Magic Link", link.getProject().getId(), "{}");

        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "status", "SUCCESS",
            "secrets", secrets
        )));
    }

    @PostMapping("/links/{token}/verify-otp")
    public ResponseEntity<ApiResponse<Object>> verifyOtp(
            @PathVariable String token,
            @RequestBody Map<String, String> request) {
        
        String otp = request.get("otp");
        if (otp == null || otp.isBlank()) {
            throw new IllegalArgumentException("OTP is required");
        }
        
        ProjectLink link = projectLinkService.verifyOtp(token, otp);
        
        List<SecretDetailResponse> secrets = secretService.exportSecretsForLink(link.getProject().getId());
        auditLogService.log(null, com.tinexus.smriti.model.ActionType.MAGIC_LINK_ACCESSED, "MAGIC_LINK", link.getId(), "Magic Link", link.getProject().getId(), "{}");

        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "status", "SUCCESS",
            "secrets", secrets
        )));
    }

    @PostMapping("/links/{token}/resend-otp")
    public ResponseEntity<ApiResponse<Object>> resendOtp(@PathVariable String token) {
        String maskedEmail = projectLinkService.resendOtp(token);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "status", "OTP_SENT",
            "maskedEmail", maskedEmail
        )));
    }
}
