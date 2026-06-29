package com.tinexus.smriti.service;

import com.tinexus.smriti.model.Secret;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.SecretRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SemanticSearchService {

    private final EmbeddingService embeddingService;
    private final SecretRepository secretRepository;

    public List<Secret> searchSecretsSemantically(User user, String query, double threshold) {
        float[] queryEmbedding = embeddingService.getEmbedding(query);
        if (queryEmbedding == null) {
            return new ArrayList<>();
        }

        List<Secret> allSecrets = secretRepository.findAllByUserId(user.getId());

        return allSecrets.stream()
                .filter(secret -> secret.getEmbedding() != null)
                .map(secret -> new SecretWithScore(secret, cosineSimilarity(queryEmbedding, secret.getEmbedding())))
                .filter(s -> s.score >= threshold)
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .map(s -> s.secret)
                .collect(Collectors.toList());
    }

    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        if (vectorA == null || vectorB == null || vectorA.length != vectorB.length) {
            return 0.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private record SecretWithScore(Secret secret, double score) {}
}
