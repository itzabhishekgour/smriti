package com.tinexus.smriti.service;

import com.tinexus.smriti.dto.CliTokenCreatedResponse;
import com.tinexus.smriti.dto.CliTokenResponse;
import com.tinexus.smriti.model.CliToken;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.CliTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CliTokenService {

    private static final String PREFIX = "smriti_pat_";
    private final CliTokenRepository cliTokenRepository;

    public CliTokenCreatedResponse createToken(User user, String name, LocalDateTime expiresAt) {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        String plainToken = PREFIX + HexFormat.of().formatHex(randomBytes);
        String hash = sha256(plainToken);

        CliToken token = CliToken.builder()
                .user(user)
                .name(name)
                .tokenHash(hash)
                .expiresAt(expiresAt)
                .build();

        CliToken saved = cliTokenRepository.save(token);

        return new CliTokenCreatedResponse(saved.getId(), saved.getName(), plainToken, saved.getCreatedAt());
    }

    public List<CliTokenResponse> listTokens(User user) {
        return cliTokenRepository.findByUserId(user.getId()).stream()
                .map(t -> new CliTokenResponse(t.getId(), t.getName(), t.getLastUsedAt(), t.getExpiresAt(), t.getCreatedAt()))
                .toList();
    }

    @Transactional
    public boolean revokeToken(UUID tokenId, User user) {
        int deleted = cliTokenRepository.deleteByIdAndUserId(tokenId, user.getId());
        return deleted > 0;
    }

    @Transactional
    public Optional<User> authenticateByToken(String plainToken) {
        String hash = sha256(plainToken);
        Optional<CliToken> maybeToken = cliTokenRepository.findByTokenHash(hash);

        if (maybeToken.isEmpty()) return Optional.empty();

        CliToken cliToken = maybeToken.get();

        if (cliToken.getExpiresAt() != null && cliToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }

        cliToken.setLastUsedAt(LocalDateTime.now());
        cliTokenRepository.save(cliToken);

        return Optional.of(cliToken.getUser());
    }

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
