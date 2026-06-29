package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.request.ThemeUpdateRequest;
import com.tinexus.smriti.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/theme")
    public ResponseEntity<Void> updateTheme(
            @Valid @RequestBody ThemeUpdateRequest request,
            Authentication authentication
    ) {
        userService.updateTheme(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/me/password")
    public ResponseEntity<com.tinexus.smriti.util.ApiResponse<Void>> updatePassword(
            @Valid @RequestBody com.tinexus.smriti.dto.request.PasswordUpdateRequest request,
            Authentication authentication
    ) {
        userService.updatePassword(authentication.getName(), request);
        return ResponseEntity.ok(new com.tinexus.smriti.util.ApiResponse<>(true, "Password updated successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<com.tinexus.smriti.util.ApiResponse<com.tinexus.smriti.dto.response.AuthResponse>> getMe(Authentication authentication) {
        com.tinexus.smriti.model.User user = userService.getCurrentUser(authentication.getName());
        com.tinexus.smriti.dto.response.AuthResponse response = new com.tinexus.smriti.dto.response.AuthResponse(
                null, // Frontend already has the token
                user.getEmail(),
                user.getName(),
                user.getId(),
                user.getTheme(),
                user.getPasswordHash() != null && !user.getPasswordHash().equals("OAUTH_USER")
        );
        return ResponseEntity.ok(com.tinexus.smriti.util.ApiResponse.success("User fetched successfully", response));
    }
}
