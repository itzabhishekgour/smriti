package com.tinexus.smriti.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Separated from SecurityConfig to break the circular dependency:
 * SecurityConfig → JwtAuthFilter → AuthService → PasswordEncoder → SecurityConfig
 *
 * With PasswordEncoder in its own config, AuthService only depends on
 * PasswordEncoderConfig (not SecurityConfig), breaking the cycle.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
