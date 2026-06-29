package com.tinexus.smriti.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LinkAccountRequest(
        @NotBlank(message = "Token is required")
        String tempToken,

        @NotBlank(message = "Password is required")
        String password
) {}
