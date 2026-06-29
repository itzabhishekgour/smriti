package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.ProjectLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectLinkRepository extends JpaRepository<ProjectLink, UUID> {
    Optional<ProjectLink> findByToken(String token);
    List<ProjectLink> findByProjectId(UUID projectId);
}
