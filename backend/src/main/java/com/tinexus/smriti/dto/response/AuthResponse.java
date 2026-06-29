package com.tinexus.smriti.dto.response;

import java.util.UUID;

public record AuthResponse(
        String token,
        String email,
        String name,
        UUID userId,
        String theme,
        boolean hasPassword
) {}
