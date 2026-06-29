package com.tinexus.smriti.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_links", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"token"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String token;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @Column(length = 255)
    private String recipientEmail;

    @Column
    private String otpCodeHash;

    @Column
    private LocalDateTime otpExpiresAt;

    @Column(nullable = false)
    @Builder.Default
    private int otpAttemptCount = 0;

    @Column
    private LocalDateTime otpLockedUntil;

    @Column
    private LocalDateTime otpLastSentAt;
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
