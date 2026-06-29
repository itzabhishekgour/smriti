package com.tinexus.smriti.dto.response;

import com.tinexus.smriti.model.Role;
import java.util.UUID;

public record ProjectShareResponse(
        UUID id,
        UUID userId,
        String userName,
        String userEmail,
        Role role
) {}
