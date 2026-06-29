package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.request.LoginRequest;
import com.tinexus.smriti.dto.request.RegisterRequest;
import com.tinexus.smriti.dto.response.AuthResponse;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/accept-terms")
    public ResponseEntity<ApiResponse<AuthResponse>> acceptTerms(
            @Valid @RequestBody com.tinexus.smriti.dto.request.AcceptTermsRequest request) {
        AuthResponse response = authService.acceptTermsViaToken(request.tempToken());
        return ResponseEntity.ok(ApiResponse.success("Terms accepted successfully", response));
    }

    @PostMapping("/link-oauth")
    public ResponseEntity<ApiResponse<AuthResponse>> linkOAuth(
            @Valid @RequestBody com.tinexus.smriti.dto.request.LinkAccountRequest request) {
        AuthResponse response = authService.linkAccount(request.tempToken(), request.password());
        return ResponseEntity.ok(ApiResponse.success("Account linked successfully", response));
    }
}
