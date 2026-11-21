package com.tinexus.smriti.controller;

import com.tinexus.smriti.util.ApiResponse;
import com.tinexus.smriti.dto.CliTokenCreateRequest;
import com.tinexus.smriti.dto.CliTokenCreatedResponse;
import com.tinexus.smriti.dto.CliTokenResponse;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.service.CliTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.tinexus.smriti.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
public class CliTokenController {

    private final CliTokenService cliTokenService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<CliTokenCreatedResponse>> createToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CliTokenCreateRequest request) {

        User user = getUser(userDetails);
        CliTokenCreatedResponse response = cliTokenService.createToken(user, request.name(), request.expiresAt());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CliTokenResponse>>> listTokens(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getUser(userDetails);
        List<CliTokenResponse> tokens = cliTokenService.listTokens(user);
        return ResponseEntity.ok(ApiResponse.success(tokens));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {

        User user = getUser(userDetails);
        boolean deleted = cliTokenService.revokeToken(id, user);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
