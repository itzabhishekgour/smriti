package com.tinexus.smriti.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.UserMessage;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiParsingService {

    private final ChatLanguageModel chatLanguageModel;
    private SecretParser secretParser;

    public record ExtractedInfo(
            String serviceName,
            String environment,
            List<String> tags
    ) {}

    public record BulkKeyParseResult(
            String key,
            String serviceName,
            List<String> tags
    ) {}

    public record BulkParseResponse(
            List<BulkKeyParseResult> results
    ) {}

    interface SecretParser {
        @UserMessage("""
            Analyze the following user note about a secret/API key and extract:
            1. serviceName: The name of the service (e.g. "Stripe", "AWS", "GitHub", "Neon", etc.). If not found or can't be inferred, return null.
            2. environment: The environment it's for. Allowed values are "dev", "test", "staging", "prod". If not found or can't be inferred, return null.
            3. tags: A list of relevant tags (e.g., ["payment", "database", "ci-cd", "auth", "development", "production", etc.]).
            
            Note: {{note}}
            """)
        ExtractedInfo parse(String note);

        @UserMessage("""
            Analyze the following list of configuration keys/variable names and guess their service name and relevant tags.
            Return a structured list of results.
            For each key:
            1. 'key': the original key name exactly as provided.
            2. 'serviceName': The inferred service name (e.g. "Stripe", "AWS", "GitHub", "PostgreSQL", "MongoDB", "Redis", etc.). Return null if unknown.
            3. 'tags': A list of relevant tags (e.g., ["payment", "database", "ci-cd", "auth", "development", "production", "cache", etc.]).
            
            Keys to analyze: {{keys}}
            """)
        BulkParseResponse bulkParse(@dev.langchain4j.service.V("keys") List<String> keys);
    }

    @PostConstruct
    public void init() {
        this.secretParser = AiServices.builder(SecretParser.class)
                .chatLanguageModel(chatLanguageModel)
                .build();
    }

    public ExtractedInfo parseNote(String note) {
        if (note == null || note.isBlank()) {
            return new ExtractedInfo(null, null, List.of());
        }
        try {
            return secretParser.parse(note);
        } catch (Exception e) {
            System.err.println("Note parsing failed: " + e.getMessage());
            return new ExtractedInfo(null, null, List.of());
        }
    }

    public List<BulkKeyParseResult> bulkParseKeys(List<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }
        try {
            BulkParseResponse response = secretParser.bulkParse(keys);
            return response.results() != null ? response.results() : List.of();
        } catch (Exception e) {
            System.err.println("Bulk parsing failed: " + e.getMessage());
            return List.of();
        }
    }
}
