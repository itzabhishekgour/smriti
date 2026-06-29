package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.RenderIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RenderIntegrationRepository extends JpaRepository<RenderIntegration, UUID> {
    Optional<RenderIntegration> findByProjectId(UUID projectId);
}
