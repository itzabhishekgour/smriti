package com.tinexus.smriti.controller;

import com.tinexus.smriti.dto.request.NoteRequest;
import com.tinexus.smriti.dto.response.NoteResponse;
import com.tinexus.smriti.util.ApiResponse;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.service.AuthService;
import com.tinexus.smriti.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final AuthService authService;

    // --- Global Notes ---
    
    @GetMapping("/notes")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getGlobalNotes(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Global notes retrieved", noteService.getGlobalNotes(user)));
    }

    @PostMapping("/notes")
    public ResponseEntity<ApiResponse<NoteResponse>> createGlobalNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NoteRequest request) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Note created", noteService.createNote(null, request, user)));
    }

    // --- Project Notes ---

    @GetMapping("/projects/{projectId}/notes")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getProjectNotes(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Project notes retrieved", noteService.getProjectNotes(projectId, user)));
    }

    @PostMapping("/projects/{projectId}/notes")
    public ResponseEntity<ApiResponse<NoteResponse>> createProjectNote(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NoteRequest request) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Project note created", noteService.createNote(projectId, request, user)));
    }

    // --- Shared Updates (Note ID) ---

    @PutMapping("/notes/{noteId}")
    public ResponseEntity<ApiResponse<NoteResponse>> updateNote(
            @PathVariable UUID noteId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NoteRequest request) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Note updated", noteService.updateNote(noteId, request, user)));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable UUID noteId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        noteService.deleteNote(noteId, user);
        return ResponseEntity.ok(ApiResponse.success("Note deleted", null));
    }
}
