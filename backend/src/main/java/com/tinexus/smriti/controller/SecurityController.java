package com.tinexus.smriti.controller;

import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.SecretScanFinding;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.SecretScanFindingRepository;
import com.tinexus.smriti.service.SecretScanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/security")
@RequiredArgsConstructor
public class SecurityController {

    private final SecretScanningService secretScanningService;
    private final SecretScanFindingRepository findingRepository;
    private final ProjectRepository projectRepository;

    @PostMapping("/scan")
    public ResponseEntity<Map<String, Object>> manualScan(@PathVariable("projectId") UUID projectId) {
        secretScanningService.scanProjectRepository(projectId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Scan completed");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/findings")
    public ResponseEntity<List<SecretScanFinding>> getFindings(@PathVariable("projectId") UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        List<SecretScanFinding> findings = findingRepository.findByProjectAndResolvedFalseOrderByDetectedAtDesc(project);
        return ResponseEntity.ok(findings);
    }

    @PostMapping("/findings/{findingId}/resolve")
    public ResponseEntity<Map<String, Object>> resolveFinding(
            @PathVariable("projectId") UUID projectId,
            @PathVariable("findingId") String findingId) {
        
        SecretScanFinding finding = findingRepository.findById(findingId)
                .orElseThrow(() -> new IllegalArgumentException("Finding not found"));
        
        finding.setResolved(true);
        findingRepository.save(finding);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
