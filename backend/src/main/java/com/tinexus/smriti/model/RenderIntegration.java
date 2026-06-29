package com.tinexus.smriti.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "render_integrations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RenderIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(name = "service_id", nullable = false)
    private String serviceId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "encrypted_api_key", nullable = false, length = 1000)
    private String encryptedApiKey;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
