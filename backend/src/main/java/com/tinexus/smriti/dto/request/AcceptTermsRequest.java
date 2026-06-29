package com.tinexus.smriti.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AcceptTermsRequest(
        @NotBlank(message = "Token is required")
        String tempToken
) {}
