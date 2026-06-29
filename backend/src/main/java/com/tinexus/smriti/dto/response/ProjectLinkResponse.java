package com.tinexus.smriti.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectLinkResponse(
        UUID id,
        String token,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        boolean isExpired,
        String recipientEmail
) {}
