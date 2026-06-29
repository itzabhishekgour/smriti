package com.tinexus.smriti.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "secret_scan_findings")
@Data
@NoArgsConstructor
public class SecretScanFinding {

    public enum MatchType {
        EXACT_MATCH,
        PATTERN_MATCH
    }

    public enum ConfidenceLevel {
        HIGH,
        LOW
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchType matchType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConfidenceLevel confidenceLevel;

    @Column(nullable = false)
    private String maskedValue;

    @Column
    private String commitSha; // Nullable if not applicable or not found

    @Column(nullable = false)
    private LocalDateTime detectedAt;

    @Column(nullable = false)
    private boolean resolved = false;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }
}
