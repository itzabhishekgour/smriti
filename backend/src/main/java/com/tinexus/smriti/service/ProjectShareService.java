package com.tinexus.smriti.service;

import com.tinexus.smriti.exception.ResourceNotFoundException;
import com.tinexus.smriti.exception.UnauthorizedException;
import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.ProjectShare;
import com.tinexus.smriti.model.Role;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.ProjectShareRepository;
import com.tinexus.smriti.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectShareService {

    private final ProjectShareRepository projectShareRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<ProjectShare> getSharesForProject(UUID projectId, User user) {
        ensureProjectOwner(projectId, user);
        return projectShareRepository.findByProjectId(projectId);
    }

    @Transactional
    public ProjectShare shareProject(UUID projectId, String email, Role role, User currentUser) {
        ensureProjectOwner(projectId, currentUser);

        User invitee = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User with email " + email + " not found"));

        if (invitee.getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cannot share project with yourself");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ProjectShare share = projectShareRepository.findByProjectIdAndUserId(projectId, invitee.getId())
                .orElse(ProjectShare.builder().project(project).user(invitee).build());
        
        share.setRole(role);
        ProjectShare savedShare = projectShareRepository.save(share);
        auditLogService.log(currentUser.getId(), com.tinexus.smriti.model.ActionType.ROLE_CHANGED, "PROJECT_SHARE", savedShare.getId(), invitee.getEmail(), projectId, "{\"to\":\"" + role.name() + "\", \"targetUserId\":\"" + invitee.getId() + "\"}");
        return savedShare;
    }

    @Transactional
    public void removeShare(UUID projectId, UUID shareId, User currentUser) {
        ensureProjectOwner(projectId, currentUser);
        ProjectShare share = projectShareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found"));
        
        if (!share.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Share does not belong to this project");
        }
        
        String inviteeEmail = share.getUser().getEmail();
        UUID inviteeId = share.getUser().getId();
        projectShareRepository.delete(share);
        auditLogService.log(currentUser.getId(), com.tinexus.smriti.model.ActionType.ROLE_CHANGED, "PROJECT_SHARE", shareId, inviteeEmail, projectId, "{\"to\":\"REMOVED\", \"targetUserId\":\"" + inviteeId + "\"}");
    }

    private void ensureProjectOwner(UUID projectId, User user) {
        if (!projectRepository.existsByIdAndUserId(projectId, user.getId())) {
            throw new UnauthorizedException("Only project owners can manage sharing");
        }
    }
}
