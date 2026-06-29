package com.tinexus.smriti.service;

import com.tinexus.smriti.model.GitHubAccountConnection;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.GitHubAccountConnectionRepository;
import com.tinexus.smriti.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class GitHubAccountService {

    private final GitHubAccountConnectionRepository repository;
    private final EncryptionService encryptionService;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    
    @Value("${spring.security.oauth2.client.registration.github-repo.client-id:placeholder}")
    private String clientId;
    
    @Value("${spring.security.oauth2.client.registration.github-repo.client-secret:placeholder}")
    private String clientSecret;

    // Track issued JTIs for replay protection
    private final Map<String, Long> pendingOAuthStates = new ConcurrentHashMap<>();

    public String getAuthorizationUrl(User user) {
        String jti = UUID.randomUUID().toString();
        // 10 minutes expiration
        String stateJwt = jwtUtil.generateTokenWithState(user.getEmail(), "github-repo-oauth", 10 * 60 * 1000, jti);
        
        pendingOAuthStates.put(jti, System.currentTimeMillis());
        
        return "https://github.com/login/oauth/authorize" +
               "?client_id=" + clientId +
               "&scope=repo" +
               "&state=" + stateJwt;
    }

    @Transactional
    public void handleCallback(String code, String stateJwt) {
        Claims claims = jwtUtil.extractAllClaims(stateJwt);
        
        if (!"github-repo-oauth".equals(claims.get("purpose", String.class))) {
            throw new IllegalArgumentException("Invalid state token purpose");
        }
        
        String jti = claims.getId();
        if (jti == null || pendingOAuthStates.remove(jti) == null) {
            throw new IllegalArgumentException("Invalid or already consumed state token (replay attempt)");
        }
        
        String email = claims.getSubject();
        User user = userService.getCurrentUser(email);
        
        String accessToken = exchangeCodeForToken(code);
        String githubUsername = fetchGithubUsername(accessToken);
        
        String encryptedToken = encryptionService.encrypt(accessToken);
        
        GitHubAccountConnection connection = repository.findByUser(user)
                .orElse(GitHubAccountConnection.builder().user(user).build());
                
        connection.setGithubUsername(githubUsername);
        connection.setEncryptedAccessToken(encryptedToken);
        
        repository.save(connection);
    }
    
    private String exchangeCodeForToken(String code) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/json");
        
        Map<String, String> body = Map.of(
            "client_id", clientId,
            "client_secret", clientSecret,
            "code", code
        );
        
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "https://github.com/login/oauth/access_token", request, Map.class
        );
        
        Map<String, String> responseBody = response.getBody();
        if (responseBody == null || !responseBody.containsKey("access_token")) {
            throw new RuntimeException("Failed to obtain GitHub access token");
        }
        
        return responseBody.get("access_token");
    }
    
    private String fetchGithubUsername(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        
        HttpEntity<String> request = new HttpEntity<>("", headers);
        ResponseEntity<Map> response = restTemplate.exchange(
            "https://api.github.com/user", HttpMethod.GET, request, Map.class
        );
        
        return (String) response.getBody().get("login");
    }

    public java.util.List<Map<String, Object>> getUserRepositories(User user) {
        GitHubAccountConnection connection = repository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("GitHub account not connected"));
        
        String accessToken = encryptionService.decrypt(connection.getEncryptedAccessToken());
        
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        
        HttpEntity<String> request = new HttpEntity<>("", headers);
        
        try {
            ResponseEntity<java.util.List> response = restTemplate.exchange(
                "https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100", 
                HttpMethod.GET, 
                request, 
                java.util.List.class
            );
            
            java.util.List<Map<String, Object>> repos = response.getBody();
            if (repos == null) return java.util.Collections.emptyList();
            
            return repos.stream().map(repo -> {
                Map<String, Object> simplified = new java.util.HashMap<>();
                simplified.put("id", repo.get("id"));
                simplified.put("name", repo.get("name"));
                simplified.put("full_name", repo.get("full_name"));
                Map<String, Object> owner = (Map<String, Object>) repo.get("owner");
                if (owner != null) {
                    simplified.put("owner", owner.get("login"));
                }
                simplified.put("private", repo.get("private"));
                return simplified;
            }).toList();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch repositories from GitHub: " + e.getMessage(), e);
        }
    }
}
