package com.tinexus.smriti.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ThemeUpdateRequest(
        @NotBlank(message = "Theme cannot be blank")
        String theme
) {}
