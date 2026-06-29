package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.ActionType;
import com.tinexus.smriti.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE a.projectId = :projectId AND (:excludeViews = false OR a.actionType != 'SECRET_VIEWED')")
    Page<AuditLog> findByProjectId(
            @Param("projectId") UUID projectId,
            @Param("excludeViews") boolean excludeViews,
            Pageable pageable
    );

    @Query("SELECT a FROM AuditLog a WHERE a.projectId = :projectId AND a.userId = :userId AND (:excludeViews = false OR a.actionType != 'SECRET_VIEWED')")
    Page<AuditLog> findByProjectIdAndUserId(
            @Param("projectId") UUID projectId,
            @Param("userId") UUID userId,
            @Param("excludeViews") boolean excludeViews,
            Pageable pageable
    );
}
