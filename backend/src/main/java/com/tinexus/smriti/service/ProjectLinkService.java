package com.tinexus.smriti.service;

import com.tinexus.smriti.exception.ResourceNotFoundException;
import com.tinexus.smriti.exception.UnauthorizedException;
import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.ProjectLink;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.ProjectLinkRepository;
import com.tinexus.smriti.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectLinkService {

    private final ProjectLinkRepository projectLinkRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    public List<ProjectLink> getLinksForProject(UUID projectId, User user) {
        ensureProjectOwner(projectId, user);
        return projectLinkRepository.findByProjectId(projectId);
    }

    @Transactional
    public ProjectLink createLink(UUID projectId, String password, int hoursValid, String recipientEmail, User user) {
        ensureProjectOwner(projectId, user);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        String token = UUID.randomUUID().toString().replace("-", "");
        String passwordHash = passwordEncoder.encode(password);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(hoursValid);

        ProjectLink link = ProjectLink.builder()
                .project(project)
                .token(token)
                .passwordHash(passwordHash)
                .expiresAt(expiresAt)
                .recipientEmail(recipientEmail)
                .build();

        ProjectLink savedLink = projectLinkRepository.save(link);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.MAGIC_LINK_GENERATED, "MAGIC_LINK", savedLink.getId(), "Magic Link", projectId, "{\"expiresAt\": \"" + expiresAt + "\"}");
        return savedLink;
    }

    @Transactional
    public void deleteLink(UUID projectId, UUID linkId, User user) {
        ensureProjectOwner(projectId, user);
        ProjectLink link = projectLinkRepository.findById(linkId)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found"));
        
        if (!link.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Link does not belong to this project");
        }
        
        projectLinkRepository.delete(link);
        auditLogService.log(user.getId(), com.tinexus.smriti.model.ActionType.MAGIC_LINK_REVOKED, "MAGIC_LINK", linkId, "Magic Link", projectId, "{}");
    }

    public ProjectLink verifyTokenAndPassword(String token, String password) {
        ProjectLink link = projectLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired link"));

        if (link.isExpired()) {
            projectLinkRepository.delete(link); // cleanup
            throw new UnauthorizedException("This link has expired");
        }

        if (!passwordEncoder.matches(password, link.getPasswordHash())) {
            throw new UnauthorizedException("Invalid password");
        }

        return link;
    }

    @Transactional
    public String triggerOtp(ProjectLink link) {
        if (link.getRecipientEmail() == null || link.getRecipientEmail().isBlank()) {
            return null; // Backward compatibility for old links
        }
        
        if (link.getOtpLockedUntil() != null && LocalDateTime.now().isBefore(link.getOtpLockedUntil())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), link.getOtpLockedUntil()).toMinutes();
            throw new UnauthorizedException("Too many failed attempts. Try again in " + (minutesLeft > 0 ? minutesLeft : 1) + " minutes.");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        
        link.setOtpCodeHash(passwordEncoder.encode(otp));
        link.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        link.setOtpAttemptCount(0);
        link.setOtpLastSentAt(LocalDateTime.now());
        
        projectLinkRepository.save(link);
        
        emailService.sendOtpEmail(link.getRecipientEmail(), otp, link.getProject().getName());
        
        // Return masked email
        String email = link.getRecipientEmail();
        String[] parts = email.split("@");
        if (parts[0].length() <= 2) return parts[0] + "***@" + parts[1];
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }

    @Transactional(noRollbackFor = UnauthorizedException.class)
    public ProjectLink verifyOtp(String token, String otp) {
        ProjectLink link = projectLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired link"));

        if (link.isExpired()) {
            projectLinkRepository.delete(link);
            throw new UnauthorizedException("This link has expired");
        }
        
        if (link.getRecipientEmail() == null || link.getRecipientEmail().isBlank()) {
            return link; // Old link without email
        }

        if (link.getOtpLockedUntil() != null && LocalDateTime.now().isBefore(link.getOtpLockedUntil())) {
            throw new UnauthorizedException("Too many failed attempts. Please request a new code later.");
        }

        if (link.getOtpExpiresAt() == null || LocalDateTime.now().isAfter(link.getOtpExpiresAt())) {
            throw new UnauthorizedException("OTP has expired. Please request a new one.");
        }

        if (!passwordEncoder.matches(otp, link.getOtpCodeHash())) {
            int attempts = link.getOtpAttemptCount() + 1;
            link.setOtpAttemptCount(attempts);
            if (attempts >= 5) {
                link.setOtpLockedUntil(LocalDateTime.now().plusMinutes(15));
            }
            projectLinkRepository.save(link);
            throw new UnauthorizedException("Invalid OTP code");
        }

        // Clear OTP data on success
        link.setOtpCodeHash(null);
        link.setOtpExpiresAt(null);
        link.setOtpAttemptCount(0);
        projectLinkRepository.save(link);

        return link;
    }

    @Transactional
    public String resendOtp(String token) {
        ProjectLink link = projectLinkRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired link"));
                
        if (link.isExpired()) throw new UnauthorizedException("This link has expired");
        if (link.getRecipientEmail() == null || link.getRecipientEmail().isBlank()) {
            throw new IllegalArgumentException("Link does not require OTP");
        }

        if (link.getOtpLockedUntil() != null && LocalDateTime.now().isBefore(link.getOtpLockedUntil())) {
            throw new UnauthorizedException("Account locked. Please try again later.");
        }

        if (link.getOtpLastSentAt() != null && LocalDateTime.now().isBefore(link.getOtpLastSentAt().plusSeconds(60))) {
            throw new UnauthorizedException("Please wait 60 seconds before requesting a new code.");
        }

        return triggerOtp(link);
    }

    private void ensureProjectOwner(UUID projectId, User user) {
        if (!projectRepository.existsByIdAndUserId(projectId, user.getId())) {
            throw new UnauthorizedException("Only project owners can manage sharing links");
        }
    }
}
