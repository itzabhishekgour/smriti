package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.request.ProjectShareRequest;
import com.tinexus.smriti.dto.response.ProjectShareResponse;
import com.tinexus.smriti.model.ProjectShare;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.service.ProjectShareService;
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
@RequestMapping("/api/projects/{projectId}/shares")
@RequiredArgsConstructor
public class ProjectShareController {

    private final ProjectShareService projectShareService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectShareResponse>>> getShares(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        List<ProjectShareResponse> shares = projectShareService.getSharesForProject(projectId, user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(shares));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectShareResponse>> shareProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectShareRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        ProjectShare share = projectShareService.shareProject(projectId, request.email(), request.role(), user);
        return ResponseEntity.ok(ApiResponse.success("Project shared successfully", toResponse(share)));
    }

    @DeleteMapping("/{shareId}")
    public ResponseEntity<ApiResponse<Void>> removeShare(
            @PathVariable UUID projectId,
            @PathVariable UUID shareId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        projectShareService.removeShare(projectId, shareId, user);
        return ResponseEntity.ok(ApiResponse.success("Access revoked", null));
    }

    private User resolveUser(UserDetails userDetails) {
        return authService.getCurrentUser(userDetails.getUsername());
    }

    private ProjectShareResponse toResponse(ProjectShare share) {
        return new ProjectShareResponse(
                share.getId(),
                share.getUser().getId(),
                share.getUser().getName(),
                share.getUser().getEmail(),
                share.getRole()
        );
    }
}
