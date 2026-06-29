package com.tinexus.smriti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_project_id", columnList = "projectId"),
        @Index(name = "idx_audit_user_id", columnList = "userId"),
        @Index(name = "idx_audit_created_at", columnList = "createdAt")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column
    private UUID userId; // Nullable if action performed by system/anonymous

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActionType actionType;

    @Column(length = 50)
    private String targetType; // "SECRET", "PROJECT", "MAGIC_LINK", etc.

    @Column
    private UUID targetId;

    @Column(length = 255)
    private String targetName; // Denormalized name at the time of action

    @Column
    private UUID projectId; // For scoping logs to a project

    @Column(columnDefinition = "text")
    private String metadata; // JSON-like string with extra info

    @Column(length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
