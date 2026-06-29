package com.tinexus.smriti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "secret_versions", indexes = {
    @Index(name = "idx_secret_versions_secret_created", columnList = "secret_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecretVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "secret_id", nullable = false)
    private Secret secret;

    @Column(nullable = false, columnDefinition = "text")
    private String encryptedValue;

    @Column(nullable = false)
    private UUID changedByUserId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
