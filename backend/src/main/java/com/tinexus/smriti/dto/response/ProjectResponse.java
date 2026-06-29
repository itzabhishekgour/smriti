package com.tinexus.smriti.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String color,
        int secretCount,
        boolean isOwner,
        String userRole,
        String ownerName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
