package com.tinexus.smriti.dto.request;

import java.time.LocalDate;

/** All fields optional — only non-null fields are applied (PATCH semantics). */
public record SecretUpdateRequest(
        String name,
        String value,           // if provided, will be re-encrypted
        String serviceName,
        String environment,
        String category,
        String originNote,
        String sourceUrl,
        LocalDate expiryDate,
        String tags
) {}
