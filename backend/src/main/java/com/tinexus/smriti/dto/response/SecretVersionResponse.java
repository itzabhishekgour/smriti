package com.tinexus.smriti.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record SecretVersionResponse(
    UUID id,
    UUID changedByUserId,
    LocalDateTime createdAt
) {}
