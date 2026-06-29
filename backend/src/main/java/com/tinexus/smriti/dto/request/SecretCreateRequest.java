package com.tinexus.smriti.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record SecretCreateRequest(
        @NotBlank(message = "Secret name is required")
        @Size(max = 200, message = "Name must be under 200 characters")
        String name,

        @NotBlank(message = "Secret value is required")
        String value,

        String serviceName,

        /** test | prod | staging | dev */
        String environment,

        /** api-key | oauth-token | database-url | webhook-secret | ssh-key | other */
        String category,

        /** User's natural language story — "Got this from Stripe dashboard on Jan 3 for the checkout feature" */
        String originNote,

        String sourceUrl,

        LocalDate expiryDate,

        /** Comma-separated tags */
        String tags
) {}
