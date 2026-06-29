package com.tinexus.smriti.dto.request;

import com.tinexus.smriti.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public record ProjectShareRequest(
        @NotNull @Email String email,
        @NotNull Role role
) {}
