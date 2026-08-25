package com.tinexus.smriti.repository;

import com.tinexus.smriti.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {
    
    // Global notes (project is null)
    List<Note> findByUserIdAndProjectIsNullOrderByCreatedAtDesc(UUID userId);
    
    // Project notes
    List<Note> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    
    // Find specific note
    Optional<Note> findByIdAndUserId(UUID id, UUID userId);
}
