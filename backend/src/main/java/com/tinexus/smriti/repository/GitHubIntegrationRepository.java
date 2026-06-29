package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.GitHubIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GitHubIntegrationRepository extends JpaRepository<GitHubIntegration, UUID> {
    Optional<GitHubIntegration> findByProjectId(UUID projectId);
}
