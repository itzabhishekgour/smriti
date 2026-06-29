package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.Secret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SecretRepository extends JpaRepository<Secret, UUID> {

    List<Secret> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    Optional<Secret> findByIdAndProjectId(UUID id, UUID projectId);

    /** Find all secrets across all user's projects — for dashboard and search */
    @Query("""
        SELECT s FROM Secret s
        JOIN s.project p
        WHERE p.user.id = :userId
        ORDER BY s.createdAt DESC
        """)
    List<Secret> findAllByUserId(@Param("userId") UUID userId);

    /** Search by name, service name, or tags (case-insensitive) */
    @Query("""
        SELECT s FROM Secret s
        JOIN s.project p
        WHERE p.user.id = :userId
          AND (
            LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(s.tags) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY s.createdAt DESC
        """)
    List<Secret> searchByUserId(@Param("userId") UUID userId, @Param("query") String query);

    @Query("SELECT COUNT(s) FROM Secret s JOIN s.project p WHERE p.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    /**
     * Count secrets expiring between today and the given threshold date.
     * Hibernate 6 does not support CURRENT_DATE + integer arithmetic in JPQL,
     * so threshold (e.g. LocalDate.now().plusDays(7)) is passed as a parameter.
     */
    @Query("""
        SELECT COUNT(s) FROM Secret s
        JOIN s.project p
        WHERE p.user.id = :userId
          AND s.expiryDate IS NOT NULL
          AND s.expiryDate >= CURRENT_DATE
          AND s.expiryDate <= :threshold
        """)
    long countExpiringSoonByUserId(@Param("userId") UUID userId, @Param("threshold") LocalDate threshold);
}
