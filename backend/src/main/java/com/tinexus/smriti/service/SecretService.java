package com.tinexus.smriti.service;

import com.tinexus.smriti.dto.request.SecretCreateRequest;
import com.tinexus.smriti.dto.request.SecretUpdateRequest;
import com.tinexus.smriti.dto.response.SecretDetailResponse;
import com.tinexus.smriti.dto.response.SecretSummaryResponse;
import com.tinexus.smriti.exception.ResourceNotFoundException;
import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.Secret;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.ProjectRepository;
import com.tinexus.smriti.repository.SecretRepository;
import com.tinexus.smriti.repository.SecretVersionRepository;
import com.tinexus.smriti.repository.ProjectShareRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecretService {

    private final SecretRepository secretRepository;
    private final ProjectRepository projectRepository;
    private final ProjectShareRepository projectShareRepository;
    private final SecretVersionRepository secretVersionRepository;
    private final EncryptionService encryptionService;
    private final AuditLogService auditLogService;
    private final EmbeddingService embeddingService;
    private final SemanticSearchService semanticSearchService;

    public List<SecretSummaryResponse> getSecretsByProject(UUID projectId, User user) {
        ensureProjectAccess(projectId, user, false);
        return secretRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    public List<SecretDetailResponse> exportSecrets(UUID projectId, User user) {
        ensureProjectAccess(projectId, user, false);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRETS_EXPORTED, "PROJECT", projectId, "Exported secrets", projectId, "{}");
        return secretRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toDetail)
                .collect(Collectors.toList());
    }

    public List<SecretDetailResponse> exportSecretsForLink(UUID projectId) {
        return secretRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toDetail)
                .collect(Collectors.toList());
    }

    public List<SecretSummaryResponse> getAllSecrets(User user) {
        return secretRepository.findAllByUserId(user.getId())
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    public List<SecretSummaryResponse> searchSecrets(User user, String query) {
        // 1. Get exact matching secrets (classic SQL LIKE search)
        List<Secret> exactSecrets = secretRepository.searchByUserId(user.getId(), query);

        // 2. Get semantic matching secrets (threshold = 0.65)
        List<Secret> semanticSecrets = semanticSearchService.searchSecretsSemantically(user, query, 0.65);

        // 3. Merge and deduplicate, keeping exact matches first
        List<Secret> merged = new ArrayList<>(exactSecrets);
        for (Secret s : semanticSecrets) {
            if (merged.stream().noneMatch(existing -> existing.getId().equals(s.getId()))) {
                merged.add(s);
            }
        }

        return merged.stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    public SecretDetailResponse getSecretDetail(UUID projectId, UUID secretId, User user) {
        ensureProjectAccess(projectId, user, false);
        Secret secret = secretRepository.findByIdAndProjectId(secretId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

        // Record access time
        secret.setLastUsedAt(LocalDateTime.now());
        secretRepository.save(secret);

        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRET_VIEWED, "SECRET", secret.getId(), secret.getName(), secret.getProject().getId(), "{}");
        return toDetail(secret);
    }

    @Transactional
    public SecretDetailResponse createSecret(UUID projectId, SecretCreateRequest request, User user) {
        ensureProjectAccess(projectId, user, true);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        float[] embedding = embeddingService.getEmbeddingForSecret(request.name(), request.serviceName(), request.originNote());

        Secret secret = Secret.builder()
                .project(project)
                .name(request.name())
                .encryptedValue(encryptionService.encrypt(request.value()))
                .serviceName(request.serviceName())
                .environment(request.environment())
                .category(request.category())
                .originNote(request.originNote())
                .sourceUrl(request.sourceUrl())
                .expiryDate(request.expiryDate())
                .tags(request.tags())
                .embedding(embedding)
                .build();

        Secret savedSecret = secretRepository.save(secret);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRET_CREATED, "SECRET", savedSecret.getId(), savedSecret.getName(), projectId, "{}");
        return toDetail(savedSecret);
    }

    @Transactional
    public List<SecretSummaryResponse> createBulkSecrets(UUID projectId, List<SecretCreateRequest> requests, User user) {
        ensureProjectAccess(projectId, user, true);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        List<Secret> secretsToSave = requests.parallelStream().map(request -> {
            float[] embedding = embeddingService.getEmbeddingForSecret(request.name(), request.serviceName(), request.originNote());
            return Secret.builder()
                    .project(project)
                    .name(request.name())
                    .encryptedValue(encryptionService.encrypt(request.value()))
                    .serviceName(request.serviceName())
                    .environment(request.environment())
                    .category(request.category())
                    .originNote(request.originNote())
                    .sourceUrl(request.sourceUrl())
                    .expiryDate(request.expiryDate())
                    .tags(request.tags())
                    .embedding(embedding)
                    .build();
        }).toList();

        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.BULK_IMPORT_PERFORMED, "PROJECT", projectId, "Imported " + secretsToSave.size() + " secrets", projectId, "{}");

        return secretRepository.saveAll(secretsToSave).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public SecretDetailResponse updateSecret(UUID projectId, UUID secretId,
                                             SecretUpdateRequest request, User user) {
        ensureProjectAccess(projectId, user, true);
        Secret secret = secretRepository.findByIdAndProjectId(secretId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));

        boolean needsReEmbed = false;
        if (request.name() != null) { secret.setName(request.name()); needsReEmbed = true; }
        if (request.value() != null) {
            // Save current value to history before overwriting
            if (secret.getEncryptedValue() != null) {
                com.tinexus.smriti.model.SecretVersion version = com.tinexus.smriti.model.SecretVersion.builder()
                        .secret(secret)
                        .encryptedValue(secret.getEncryptedValue())
                        .changedByUserId(user.getId())
                        .build();
                secretVersionRepository.save(version);
            }
            secret.setEncryptedValue(encryptionService.encrypt(request.value()));
        }
        if (request.serviceName() != null) { secret.setServiceName(request.serviceName()); needsReEmbed = true; }
        if (request.environment() != null) secret.setEnvironment(request.environment());
        if (request.category() != null) secret.setCategory(request.category());
        if (request.originNote() != null) { secret.setOriginNote(request.originNote()); needsReEmbed = true; }
        if (request.sourceUrl() != null) secret.setSourceUrl(request.sourceUrl());
        if (request.expiryDate() != null) secret.setExpiryDate(request.expiryDate());
        if (request.tags() != null) secret.setTags(request.tags());

        if (needsReEmbed) {
            float[] embedding = embeddingService.getEmbeddingForSecret(secret.getName(), secret.getServiceName(), secret.getOriginNote());
            secret.setEmbedding(embedding);
        }

        Secret savedSecret = secretRepository.save(secret);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRET_UPDATED, "SECRET", savedSecret.getId(), savedSecret.getName(), projectId, "{}");
        return toDetail(savedSecret);
    }

    @Transactional
    public void deleteSecret(UUID projectId, UUID secretId, User user) {
        ensureProjectAccess(projectId, user, true);
        Secret secret = secretRepository.findByIdAndProjectId(secretId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));
        secretRepository.delete(secret);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRET_DELETED, "SECRET", secret.getId(), secret.getName(), projectId, "{}");
    }

    public List<com.tinexus.smriti.dto.response.SecretVersionResponse> getSecretVersions(UUID projectId, UUID secretId, User user) {
        ensureProjectAccess(projectId, user, false);
        Secret secret = secretRepository.findByIdAndProjectId(secretId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));
        
        return secretVersionRepository.findBySecretIdOrderByCreatedAtDesc(secretId)
                .stream()
                .map(v -> new com.tinexus.smriti.dto.response.SecretVersionResponse(
                        v.getId(), v.getChangedByUserId(), v.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public String getSecretVersionValue(UUID projectId, UUID secretId, UUID versionId, User user) {
        ensureProjectAccess(projectId, user, false);
        Secret secret = secretRepository.findByIdAndProjectId(secretId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));
                
        com.tinexus.smriti.model.SecretVersion version = secretVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));
                
        if (!version.getSecret().getId().equals(secretId)) {
            throw new IllegalArgumentException("Version does not belong to this secret");
        }

        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRET_VIEWED, "SECRET", secret.getId(), secret.getName() + " (Version " + version.getId() + ")", projectId, "{}");
        return encryptionService.decrypt(version.getEncryptedValue());
    }

    @Transactional
    public SecretDetailResponse rollbackToVersion(UUID projectId, UUID secretId, UUID versionId, User user) {
        ensureProjectAccess(projectId, user, true); // Require Editor
        Secret secret = secretRepository.findByIdAndProjectId(secretId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Secret not found"));
                
        com.tinexus.smriti.model.SecretVersion version = secretVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));
                
        if (!version.getSecret().getId().equals(secretId)) {
            throw new IllegalArgumentException("Version does not belong to this secret");
        }

        // Archive current value before rollback
        com.tinexus.smriti.model.SecretVersion newVersion = com.tinexus.smriti.model.SecretVersion.builder()
                .secret(secret)
                .encryptedValue(secret.getEncryptedValue())
                .changedByUserId(user.getId())
                .build();
        secretVersionRepository.save(newVersion);

        // Apply rollback
        secret.setEncryptedValue(version.getEncryptedValue());
        Secret savedSecret = secretRepository.save(secret);

        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.SECRET_ROLLED_BACK, "SECRET", secret.getId(), secret.getName(), projectId, "{\"rolledBackToVersion\": \"" + version.getId() + "\"}");
        return toDetail(savedSecret);
    }

    // ─── Stats for dashboard ────────────────────────────────────────────────
    public long countByUser(User user) {
        return secretRepository.countByUserId(user.getId());
    }

    public long countExpiringSoon(User user) {
        return secretRepository.countExpiringSoonByUserId(user.getId(), LocalDate.now().plusDays(7));
    }

    // ─── Private helpers ────────────────────────────────────────────────────
    private void ensureProjectAccess(UUID projectId, User user, boolean requireEditor) {
        boolean isOwner = projectRepository.existsByIdAndUserId(projectId, user.getId());
        if (isOwner) return;

        com.tinexus.smriti.model.ProjectShare share = projectShareRepository.findByProjectIdAndUserId(projectId, user.getId()).orElse(null);
        if (share == null) {
            throw new com.tinexus.smriti.exception.UnauthorizedException("You do not have access to this project");
        }
        
        if (requireEditor && share.getRole() != com.tinexus.smriti.model.Role.EDITOR) {
            throw new com.tinexus.smriti.exception.UnauthorizedException("You need EDITOR role to modify secrets");
        }
    }

    private SecretSummaryResponse toSummary(Secret s) {
        LocalDate today = LocalDate.now();
        boolean expired = s.getExpiryDate() != null && s.getExpiryDate().isBefore(today);
        boolean expiringSoon = s.getExpiryDate() != null
                && !expired
                && s.getExpiryDate().isBefore(today.plusDays(8));
        return new SecretSummaryResponse(
                s.getId(), s.getName(), s.getServiceName(), s.getEnvironment(),
                s.getCategory(), s.getTags(), s.getExpiryDate(), expired, expiringSoon,
                s.getProject().getId(), s.getProject().getName(),
                s.getCreatedAt(), s.getUpdatedAt()
        );
    }

    private SecretDetailResponse toDetail(Secret s) {
        LocalDate today = LocalDate.now();
        boolean expired = s.getExpiryDate() != null && s.getExpiryDate().isBefore(today);
        boolean expiringSoon = s.getExpiryDate() != null
                && !expired
                && s.getExpiryDate().isBefore(today.plusDays(8));
        String decrypted = encryptionService.decrypt(s.getEncryptedValue());
        return new SecretDetailResponse(
                s.getId(), s.getName(), decrypted,
                s.getServiceName(), s.getEnvironment(), s.getCategory(),
                s.getOriginNote(), s.getSourceUrl(), s.getTags(),
                s.getExpiryDate(), expired, expiringSoon, s.getLastUsedAt(),
                s.getProject().getId(), s.getProject().getName(),
                s.getCreatedAt(), s.getUpdatedAt()
        );
    }
}
