package com.tinexus.smriti.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Used for detail view — includes decrypted value.
 * Only returned when user explicitly requests a single secret.
 */
public record SecretDetailResponse(
        UUID id,
        String name,
        String value,             // DECRYPTED — never log this
        String serviceName,
        String environment,
        String category,
        String originNote,
        String sourceUrl,
        String tags,
        LocalDate expiryDate,
        boolean isExpired,
        boolean isExpiringSoon,
        LocalDateTime lastUsedAt,
        UUID projectId,
        String projectName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
