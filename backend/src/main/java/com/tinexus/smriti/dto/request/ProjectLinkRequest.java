package com.tinexus.smriti.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;

public record ProjectLinkRequest(
        @NotBlank String password,
        @Min(1) int hoursValid,
        @NotBlank String recipientEmail
) {}
