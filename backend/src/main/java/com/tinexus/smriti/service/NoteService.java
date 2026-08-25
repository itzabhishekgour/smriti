package com.tinexus.smriti.service;

import com.tinexus.smriti.dto.request.NoteRequest;
import com.tinexus.smriti.dto.response.NoteResponse;
import com.tinexus.smriti.exception.ResourceNotFoundException;
import com.tinexus.smriti.exception.UnauthorizedException;
import com.tinexus.smriti.model.Note;
import com.tinexus.smriti.model.Project;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.NoteRepository;
import com.tinexus.smriti.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final ProjectRepository projectRepository;
    private final EncryptionService encryptionService;

    public List<NoteResponse> getGlobalNotes(User user) {
        return noteRepository.findByUserIdAndProjectIsNullOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<NoteResponse> getProjectNotes(UUID projectId, User user) {
        ensureProjectAccess(projectId, user);
        return noteRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse createNote(UUID projectId, NoteRequest request, User user) {
        Project project = null;
        if (projectId != null) {
            ensureProjectAccess(projectId, user);
            project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        }

        Note note = Note.builder()
                .user(user)
                .project(project)
                .title(request.title())
                .encryptedContent(encryptionService.encrypt(request.content()))
                .build();

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse updateNote(UUID noteId, NoteRequest request, User user) {
        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        if (request.title() != null) note.setTitle(request.title());
        if (request.content() != null) note.setEncryptedContent(encryptionService.encrypt(request.content()));

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void deleteNote(UUID noteId, User user) {
        Note note = noteRepository.findByIdAndUserId(noteId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        noteRepository.delete(note);
    }

    private void ensureProjectAccess(UUID projectId, User user) {
        if (!projectRepository.existsByIdAndUserId(projectId, user.getId())) {
            // For simplicity in this demo, only owners can see project notes. 
            // Real impl would check projectShareRepository too.
            throw new UnauthorizedException("You do not have access to this project");
        }
    }

    private NoteResponse toResponse(Note note) {
        String decryptedContent = encryptionService.decrypt(note.getEncryptedContent());
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                decryptedContent,
                note.getProject() != null ? note.getProject().getId() : null,
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
