package com.tinexus.smriti.controller;

import com.tinexus.smriti.model.GitHubAccountConnection;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.repository.GitHubAccountConnectionRepository;
import com.tinexus.smriti.service.GitHubAccountService;
import com.tinexus.smriti.service.UserService;
import com.tinexus.smriti.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@RestController
@RequestMapping("/api/integrations/github-account")
@RequiredArgsConstructor
public class GitHubAccountController {

    private final GitHubAccountService gitHubAccountService;
    private final UserService userService;
    private final GitHubAccountConnectionRepository repository;
    
    @Value("${smriti.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/connect")
    public ResponseEntity<ApiResponse<Map<String, String>>> getConnectUrl(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        String url = gitHubAccountService.getAuthorizationUrl(user);
        return ResponseEntity.ok(ApiResponse.success("URL generated", Map.of("url", url)));
    }

    @GetMapping("/callback")
    public RedirectView callback(
            @RequestParam("code") String code,
            @RequestParam("state") String stateJwt) {
        try {
            gitHubAccountService.handleCallback(code, stateJwt);
            return new RedirectView(frontendUrl + "/settings?github_connected=true");
        } catch (Exception e) {
            return new RedirectView(frontendUrl + "/settings?github_connected=false&error=" + e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        return repository.findByUser(user)
                .map(conn -> ResponseEntity.ok(ApiResponse.<Map<String, Object>>success("Connected", Map.of(
                        "connected", true,
                        "githubUsername", conn.getGithubUsername(),
                        "connectedAt", conn.getConnectedAt()
                ))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.<Map<String, Object>>success("Not connected", Map.<String, Object>of("connected", false))));
    }

    @GetMapping("/repos")
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> getRepositories(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        java.util.List<Map<String, Object>> repos = gitHubAccountService.getUserRepositories(user);
        return ResponseEntity.ok(ApiResponse.success("Repositories fetched", repos));
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<ApiResponse<Void>> disconnect(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        repository.deleteByUser(user);
        return ResponseEntity.ok(ApiResponse.success("Disconnected successfully", null));
    }
}
