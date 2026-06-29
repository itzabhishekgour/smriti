package com.tinexus.smriti.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectCreateRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 200, message = "Name must be under 200 characters")
        String name,

        String description,

        /** Optional UI accent hex color, e.g. "#6366f1" */
        String color
) {}
