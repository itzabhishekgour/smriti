package com.tinexus.smriti.controller;

import com.tinexus.smriti.service.AiParsingService;
import com.tinexus.smriti.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiParsingService aiParsingService;

    public record ParseRequest(String note) {}

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<AiParsingService.ExtractedInfo>> parseNote(@RequestBody ParseRequest request) {
        AiParsingService.ExtractedInfo info = aiParsingService.parseNote(request.note());
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    public record BulkParseRequest(java.util.List<String> keys) {}

    @PostMapping("/bulk-parse")
    public ResponseEntity<ApiResponse<java.util.List<AiParsingService.BulkKeyParseResult>>> bulkParseKeys(@RequestBody BulkParseRequest request) {
        java.util.List<AiParsingService.BulkKeyParseResult> results = aiParsingService.bulkParseKeys(request.keys());
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
