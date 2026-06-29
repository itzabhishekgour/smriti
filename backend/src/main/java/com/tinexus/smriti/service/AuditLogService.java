package com.tinexus.smriti.service;

import com.tinexus.smriti.model.ActionType;
import com.tinexus.smriti.model.AuditLog;
import com.tinexus.smriti.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(UUID userId, ActionType actionType, String targetType, UUID targetId, String targetName, UUID projectId, String metadata) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .actionType(actionType)
                    .targetType(targetType)
                    .targetId(targetId)
                    .targetName(targetName)
                    .projectId(projectId)
                    .metadata(metadata)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: action={}, target={}", actionType, targetName, e);
        }
    }
}
