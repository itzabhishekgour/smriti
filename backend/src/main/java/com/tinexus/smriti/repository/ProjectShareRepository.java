package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.ProjectShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectShareRepository extends JpaRepository<ProjectShare, UUID> {
    List<ProjectShare> findByProjectId(UUID projectId);
    List<ProjectShare> findByUserId(UUID userId);
    Optional<ProjectShare> findByProjectIdAndUserId(UUID projectId, UUID userId);
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}
