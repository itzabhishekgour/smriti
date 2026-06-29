package com.tinexus.smriti.service;

import com.tinexus.smriti.dto.request.ThemeUpdateRequest;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional
    public void updateTheme(String email, ThemeUpdateRequest request) {
        User user = authService.getCurrentUser(email);
        
        String newTheme = request.theme().toLowerCase();
        if (!newTheme.equals("light") && !newTheme.equals("dark") && !newTheme.equals("system")) {
            throw new IllegalArgumentException("Invalid theme value. Allowed: light, dark, system");
        }
        
        user.setTheme(newTheme);
        userRepository.save(user);
    }

    public User getCurrentUser(String email) {
        return authService.getCurrentUser(email);
    }

    @Transactional
    public void updatePassword(String email, com.tinexus.smriti.dto.request.PasswordUpdateRequest request) {
        User user = authService.getCurrentUser(email);
        
        if (user.getPasswordHash() != null && !user.getPasswordHash().equals("OAUTH_USER")) {
            if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                throw new IllegalArgumentException("Current password is required");
            }
            if (!authService.getPasswordEncoder().matches(request.currentPassword(), user.getPasswordHash())) {
                throw new com.tinexus.smriti.exception.UnauthorizedException("Invalid current password");
            }
        }
        
        user.setPasswordHash(authService.getPasswordEncoder().encode(request.newPassword()));
        userRepository.save(user);
    }
}
