package com.tinexus.smriti.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CliTokenCreatedResponse(
        UUID id,
        String name,
        String token,
        LocalDateTime createdAt
) {}
