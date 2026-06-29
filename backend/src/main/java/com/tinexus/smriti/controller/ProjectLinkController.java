package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.request.ProjectLinkRequest;
import com.tinexus.smriti.dto.response.ProjectLinkResponse;
import com.tinexus.smriti.model.ProjectLink;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.service.ProjectLinkService;
import com.tinexus.smriti.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/links")
@RequiredArgsConstructor
public class ProjectLinkController {

    private final ProjectLinkService projectLinkService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectLinkResponse>>> getLinks(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        List<ProjectLinkResponse> links = projectLinkService.getLinksForProject(projectId, user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(links));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectLinkResponse>> createLink(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectLinkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        ProjectLink link = projectLinkService.createLink(projectId, request.password(), request.hoursValid(), request.recipientEmail(), user);
        return ResponseEntity.ok(ApiResponse.success("Link generated successfully", toResponse(link)));
    }

    @DeleteMapping("/{linkId}")
    public ResponseEntity<ApiResponse<Void>> deleteLink(
            @PathVariable UUID projectId,
            @PathVariable UUID linkId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        projectLinkService.deleteLink(projectId, linkId, user);
        return ResponseEntity.ok(ApiResponse.success("Link deleted successfully", null));
    }

    private User resolveUser(UserDetails userDetails) {
        return authService.getCurrentUser(userDetails.getUsername());
    }

    private ProjectLinkResponse toResponse(ProjectLink link) {
        return new ProjectLinkResponse(
                link.getId(),
                link.getToken(),
                link.getExpiresAt(),
                link.getCreatedAt(),
                link.isExpired(),
                link.getRecipientEmail()
        );
    }
}
