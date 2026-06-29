package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Project> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.user.id = :userId")
    long countByUserId(UUID userId);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN ProjectShare ps ON p.id = ps.project.id WHERE p.user.id = :userId OR ps.user.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findAccessibleProjects(UUID userId);

    @Query("SELECT COUNT(p) > 0 FROM Project p LEFT JOIN ProjectShare ps ON p.id = ps.project.id WHERE p.id = :id AND (p.user.id = :userId OR ps.user.id = :userId)")
    boolean isAccessible(UUID id, UUID userId);
}
