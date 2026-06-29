package com.tinexus.smriti.dto.response;

import com.tinexus.smriti.model.ActionType;
import com.tinexus.smriti.model.AuditLog;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID userId,
        String userName, // We will populate this in the controller
        ActionType actionType,
        String targetType,
        UUID targetId,
        String targetName,
        UUID projectId,
        String metadata,
        LocalDateTime createdAt
) {}
