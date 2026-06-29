package com.tinexus.smriti.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public Claims extractAllClaims(String token) {
        return parseClaims(token);
    }

    public String generateTokenWithPurpose(String email, String purpose, long customExpirationMs) {
        return Jwts.builder()
                .subject(email)
                .claim("purpose", purpose)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + customExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateTokenWithPurpose(String email, String purpose, long customExpirationMs, String provider) {
        return Jwts.builder()
                .subject(email)
                .claim("purpose", purpose)
                .claim("provider", provider)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + customExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateTokenWithState(String subject, String purpose, long customExpirationMs, String jti) {
        return Jwts.builder()
                .subject(subject)
                .claim("purpose", purpose)
                .id(jti)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + customExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
