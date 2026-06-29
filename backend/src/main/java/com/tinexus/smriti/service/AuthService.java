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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordEncoder getPasswordEncoder() {
        return passwordEncoder;
    }
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
                .acceptedTermsAt(LocalDateTime.now())
                .termsVersion("v1")
                .authProvider("EMAIL")
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId(), user.getTheme(), user.getPasswordHash() != null && !user.getPasswordHash().equals("OAUTH_USER"));
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
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId(), user.getTheme(), user.getPasswordHash() != null && !user.getPasswordHash().equals("OAUTH_USER"));
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Transactional
    public User findOrCreateOAuthUser(String email, String name, String provider) {
        return userRepository.findByEmail(email).map(existingUser -> {
            // Existing user found
            if (!existingUser.getAuthProvider().contains(provider)) {
                // If it's an EMAIL account, or a mismatch (e.g., Google vs GitHub), require step-up
                throw new com.tinexus.smriti.exception.AccountRequiresLinkException("Account exists with different provider");
            }
            return existingUser;
        }).orElseGet(() -> {
            // New user
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .passwordHash("OAUTH_USER")
                    .authProvider(provider)
                    .build();
            return userRepository.save(newUser);
        });
    }

    @Transactional
    public AuthResponse acceptTermsViaToken(String tempToken) {
        // We will validate token in controller or here. Let's assume tempToken is already verified 
        // to have purpose=oauth-terms-pending and we extracted the email.
        // Wait, the backend decodes/validates to identify user. 
        // We need jwtUtil to parse it and get email and purpose.
        
        io.jsonwebtoken.Claims claims = jwtUtil.extractAllClaims(tempToken);
        String purpose = claims.get("purpose", String.class);
        if (!"oauth-terms-pending".equals(purpose)) {
            throw new IllegalArgumentException("Invalid token purpose");
        }
        
        String email = claims.getSubject();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        user.setAcceptedTermsAt(LocalDateTime.now());
        user.setTermsVersion("v1");
        userRepository.save(user);
        
        String token = jwtUtil.generateToken(user.getEmail());
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.USER_LOGIN, "USER", user.getId(), user.getEmail(), null, "{\"method\": \"oauth\"}");
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId(), user.getTheme(), user.getPasswordHash() != null && !user.getPasswordHash().equals("OAUTH_USER"));
    }

    @Transactional
    public AuthResponse linkAccount(String tempToken, String password) {
        io.jsonwebtoken.Claims claims = jwtUtil.extractAllClaims(tempToken);
        String purpose = claims.get("purpose", String.class);
        if (!"oauth-link-pending".equals(purpose)) {
            throw new IllegalArgumentException("Invalid token purpose");
        }
        
        String email = claims.getSubject();
        String newProvider = claims.get("provider", String.class);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.USER_LOGIN_FAILED, "USER", user.getId(), user.getEmail(), null, "{\"reason\": \"Invalid password for account link\"}");
            throw new UnauthorizedException("Invalid password");
        }
        
        // Update provider to reflect linking (e.g., EMAIL+GOOGLE) or just keep EMAIL. We will just keep EMAIL to allow password login, 
        // but maybe append to show it's linked? For now, we don't strictly need to change it if it's already EMAIL.
        // If we don't change it, findOrCreateOAuthUser will throw AccountRequiresLinkException every time they login with OAuth.
        // Ah! If we don't update authProvider, they have to enter password EVERY time they use OAuth.
        // So let's update it to "EMAIL+" + newProvider. Or better, let findOrCreateOAuthUser accept it if it contains the provider.
        if (!user.getAuthProvider().contains(newProvider)) {
            user.setAuthProvider(user.getAuthProvider() + "+" + newProvider);
            userRepository.save(user);
        }
        
        String token = jwtUtil.generateToken(user.getEmail());
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.USER_LOGIN, "USER", user.getId(), user.getEmail(), null, "{\"method\": \"oauth-link\"}");
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId(), user.getTheme(), user.getPasswordHash() != null && !user.getPasswordHash().equals("OAUTH_USER"));
    }
}
