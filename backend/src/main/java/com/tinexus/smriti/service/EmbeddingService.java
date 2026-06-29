package com.tinexus.smriti.service;

import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;

    public float[] getEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return embeddingModel.embed(text).content().vector();
        } catch (Exception e) {
            // Log and fall back to null if embedding fails
            System.err.println("Embedding generation failed: " + e.getMessage());
            return null;
        }
    }

    public float[] getEmbeddingForSecret(String name, String serviceName, String originNote) {
        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name).append(" ");
        if (serviceName != null) sb.append(serviceName).append(" ");
        if (originNote != null) sb.append(originNote);

        String content = sb.toString().trim();
        return getEmbedding(content);
    }
}
