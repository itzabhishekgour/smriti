package com.tinexus.smriti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "secrets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Secret {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Display name — e.g. "Stripe Publishable Key" */
    @Column(nullable = false, length = 200)
    private String name;

    /** AES-256-GCM encrypted value stored as Base64(IV + ciphertext) */
    @Column(nullable = false, columnDefinition = "text")
    private String encryptedValue;

    /** AI-parsed (Layer 2) or manually set service name — e.g. "Stripe", "AWS" */
    @Column(length = 100)
    private String serviceName;

    /** test | prod | staging | dev */
    @Column(length = 50)
    private String environment;

    /** api-key | oauth-token | database-url | webhook-secret | ssh-key | other */
    @Column(length = 50)
    private String category;

    /** User's natural language story about this secret */
    @Column(columnDefinition = "text")
    private String originNote;

    /** URL where the secret was obtained from */
    @Column(length = 2048)
    private String sourceUrl;

    /** Known or AI-detected expiry date */
    @Column
    private LocalDate expiryDate;

    /** Tracks last time secret value was copied/accessed (for Layer 3 nudges) */
    @Column
    private LocalDateTime lastUsedAt;

    /** Comma-separated tags for filtering */
    @Column(columnDefinition = "text")
    private String tags;

    @Convert(converter = com.tinexus.smriti.util.FloatArrayConverter.class)
    @Column(columnDefinition = "text")
    private float[] embedding;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
