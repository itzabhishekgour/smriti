package com.tinexus.smriti.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Used in list views — value is MASKED ("••••••••") for security.
 * Use SecretDetailResponse for the actual decrypted value.
 */
public record SecretSummaryResponse(
        UUID id,
        String name,
        String serviceName,
        String environment,
        String category,
        String tags,
        String sourceUrl,
        LocalDate expiryDate,
        boolean isExpired,
        boolean isExpiringSoon,   // within 7 days
        UUID projectId,
        String projectName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
