package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.response.AuditLogResponse;
import com.tinexus.smriti.model.AuditLog;
import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.ProjectShare;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.AuditLogRepository;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.ProjectShareRepository;
import com.tinexus.smriti.repository.UserRepository;
import com.tinexus.smriti.exception.ResourceNotFoundException;
import com.tinexus.smriti.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final ProjectRepository projectRepository;
    private final ProjectShareRepository projectShareRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getLogs(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestParam(defaultValue = "false") boolean includeViews,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        boolean isOwner = project.getUser().getId().equals(user.getId());
        
        if (!isOwner) {
            ProjectShare share = projectShareRepository.findByProjectIdAndUserId(projectId, user.getId())
                    .orElseThrow(() -> new UnauthorizedException("No access to this project"));
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> logsPage;

        if (isOwner) {
            logsPage = auditLogRepository.findByProjectId(projectId, !includeViews, pageable);
        } else {
            // Viewers/Editors can only see their own logs
            logsPage = auditLogRepository.findByProjectIdAndUserId(projectId, user.getId(), !includeViews, pageable);
        }

        // Fetch names for users
        Map<UUID, String> userNames = userRepository.findAllById(
                logsPage.getContent().stream().map(AuditLog::getUserId).filter(id -> id != null).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(User::getId, User::getName));

        Page<AuditLogResponse> responsePage = logsPage.map(log -> new AuditLogResponse(
                log.getId(),
                log.getUserId(),
                log.getUserId() != null ? userNames.getOrDefault(log.getUserId(), "Unknown User") : "System / Anonymous",
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getTargetName(),
                log.getProjectId(),
                log.getMetadata(),
                log.getCreatedAt()
        ));

        return ResponseEntity.ok(responsePage);
    }
}
