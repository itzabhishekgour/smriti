package com.tinexus.smriti.service;

import com.tinexus.smriti.model.Secret;
import com.tinexus.smriti.model.User;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.UserMessage;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiAskService {

    private final SemanticSearchService semanticSearchService;
    private final EncryptionService encryptionService;
    private final ChatLanguageModel chatLanguageModel;
    
    private SecretIdentifier secretIdentifier;

    public record AiAskResponse(
            String answer,
            List<AiMatchedSecret> relatedSecrets
    ) {}

    public record AiMatchedSecret(
            String id,
            String name,
            String serviceName,
            String decryptedValue
    ) {}

    interface SecretIdentifier {
        @UserMessage("""
            You are a strict, focused AI assistant for a secret manager called Smriti.
            Your ONLY job is to help the user find their stored secrets based on their natural language question.
            
            STRICT RULES:
            1. If the user asks a general knowledge question, tries to chat with you like ChatGPT, or asks anything unrelated to their secrets, you MUST politely refuse and state: "I am Smriti AI. I can only help you find your stored secrets."
            2. Do not make up any secret values.
            
            User Question: {{query}}
            
            Below is a list of their secrets (metadata only, NO actual passwords/keys are shown).
            Context Secrets: 
            {{context}}
            
            Based ONLY on the User Question and Context Secrets, you must determine WHICH secret the user is asking for.
            Write a brief, helpful 1-2 sentence response confirming the secret they asked for (e.g. "Here is your database key for Smriti:").
            """)
        String answerQuery(@dev.langchain4j.service.V("query") String query, @dev.langchain4j.service.V("context") String context);
    }

    @PostConstruct
    public void init() {
        this.secretIdentifier = AiServices.builder(SecretIdentifier.class)
                .chatLanguageModel(chatLanguageModel)
                .build();
    }

    public AiAskResponse askAboutSecrets(String query, User user) {
        // 1. Semantic search to get top matching secrets
        List<Secret> matchingSecrets = semanticSearchService.searchSecretsSemantically(user, query, 0.4);

        if (matchingSecrets.isEmpty()) {
            return new AiAskResponse("I couldn't find any secrets matching your question.", List.of());
        }

        // 2. Prepare metadata context for AI (NEVER SEND ACTUAL SECRET VALUES)
        // We only send the top 3 to keep context concise
        List<Secret> topSecrets = matchingSecrets.stream().limit(3).toList();
        
        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < topSecrets.size(); i++) {
            Secret s = topSecrets.get(i);
            contextBuilder.append("Secret [").append(i).append("]: ")
                    .append("ID=").append(s.getId().toString())
                    .append(", Name=").append(s.getName())
                    .append(", Service=").append(s.getServiceName() != null ? s.getServiceName() : "N/A")
                    .append(", Note=").append(s.getOriginNote() != null ? s.getOriginNote() : "N/A")
                    .append("\n");
        }

        // 3. Ask AI to formulate a response
        String aiAnswer = secretIdentifier.answerQuery(query, contextBuilder.toString());

        // 4. Prepare the final response with locally decrypted values
        List<AiMatchedSecret> related = topSecrets.stream().map(s -> new AiMatchedSecret(
                s.getId().toString(),
                s.getName(),
                s.getServiceName(),
                encryptionService.decrypt(s.getEncryptedValue()) // Decrypt LOCALLY
        )).collect(Collectors.toList());

        return new AiAskResponse(aiAnswer, related);
    }
}
