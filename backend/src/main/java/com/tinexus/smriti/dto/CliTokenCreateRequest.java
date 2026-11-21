package com.tinexus.smriti.dto;

import java.time.LocalDateTime;

public record CliTokenCreateRequest(
        String name,
        LocalDateTime expiresAt
) {}
