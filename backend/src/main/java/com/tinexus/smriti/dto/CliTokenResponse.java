package com.tinexus.smriti.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CliTokenResponse(
        UUID id,
        String name,
        LocalDateTime lastUsedAt,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {}
