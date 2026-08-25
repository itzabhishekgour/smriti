package com.tinexus.smriti.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record NoteResponse(
        UUID id,
        String title,
        String content,
        UUID projectId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
