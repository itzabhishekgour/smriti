package com.tinexus.smriti.service;

import com.tinexus.smriti.dto.request.ProjectCreateRequest;
import com.tinexus.smriti.dto.response.ProjectResponse;
import com.tinexus.smriti.exception.ResourceNotFoundException;
import com.tinexus.smriti.exception.UnauthorizedException;
import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.SecretRepository;
import com.tinexus.smriti.repository.ProjectShareRepository;
import com.tinexus.smriti.model.ProjectShare;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final SecretRepository secretRepository;
    private final ProjectShareRepository projectShareRepository;
    private final AuditLogService auditLogService;

    public List<ProjectResponse> getAllProjects(User user) {
        return projectRepository.findAccessibleProjects(user.getId())
                .stream()
                .map(p -> toResponse(p, user.getId()))
                .collect(Collectors.toList());
    }

    public ProjectResponse getProject(UUID projectId, User user) {
        if (!projectRepository.isAccessible(projectId, user.getId())) {
            throw new ResourceNotFoundException("Project not found");
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return toResponse(project, user.getId());
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, User user) {
        Project project = Project.builder()
                .user(user)
                .name(request.name())
                .description(request.description())
                .color(request.color() != null ? request.color() : "#6366f1")
                .build();
        project = projectRepository.save(project);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.PROJECT_CREATED, "PROJECT", project.getId(), project.getName(), project.getId(), "{}");
        return toResponse(project, user.getId());
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, ProjectCreateRequest request, User user) {
        // Only owners or EDITORs should update project? Usually only owners can update the project details.
        Project project = projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new UnauthorizedException("Only project owners can update project details"));

        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());
        if (request.color() != null) project.setColor(request.color());

        project = projectRepository.save(project);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.PROJECT_UPDATED, "PROJECT", project.getId(), project.getName(), project.getId(), "{}");
        return toResponse(project, user.getId());
    }

    @Transactional
    public void deleteProject(UUID projectId, User user) {
        if (!projectRepository.existsByIdAndUserId(projectId, user.getId())) {
            throw new UnauthorizedException("Only project owners can delete the project");
        }
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            String projectName = project.getName();
            projectRepository.deleteById(projectId);
            auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.PROJECT_DELETED, "PROJECT", projectId, projectName, projectId, "{}");
        }
    }

    private ProjectResponse toResponse(Project p, UUID userId) {
        int count = secretRepository.findByProjectIdOrderByCreatedAtDesc(p.getId()).size();
        boolean isOwner = p.getUser().getId().equals(userId);
        String userRole = "OWNER";
        
        if (!isOwner) {
            ProjectShare share = projectShareRepository.findByProjectIdAndUserId(p.getId(), userId).orElse(null);
            if (share != null) {
                userRole = share.getRole().name();
            } else {
                userRole = "NONE";
            }
        }
        
        return new ProjectResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getColor(),
                count,
                isOwner,
                userRole,
                p.getUser().getName(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
