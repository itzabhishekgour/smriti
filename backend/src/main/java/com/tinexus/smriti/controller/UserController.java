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
}
