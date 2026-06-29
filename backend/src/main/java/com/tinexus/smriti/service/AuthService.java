package com.tinexus.smriti.service;

import com.tinexus.smriti.dto.request.LoginRequest;
import com.tinexus.smriti.dto.request.RegisterRequest;
import com.tinexus.smriti.dto.response.AuthResponse;
import com.tinexus.smriti.exception.UnauthorizedException;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.UserRepository;
import com.tinexus.smriti.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId(), user.getTheme());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    auditLogService.log(null, com.tinexus.smriti.model.ActionType.USER_LOGIN_FAILED, "USER", null, request.email(), null, "{\"reason\": \"User not found\"}");
                    return new UnauthorizedException("Invalid email or password");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.USER_LOGIN_FAILED, "USER", user.getId(), user.getEmail(), null, "{\"reason\": \"Invalid password\"}");
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.USER_LOGIN, "USER", user.getId(), user.getEmail(), null, "{}");
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId(), user.getTheme());
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
