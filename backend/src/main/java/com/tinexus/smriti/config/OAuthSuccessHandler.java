package com.tinexus.smriti.config;

import com.tinexus.smriti.exception.AccountRequiresLinkException;
import com.tinexus.smriti.model.User;
import com.tinexus.smriti.security.JwtUtil;
import com.tinexus.smriti.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuthSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final OAuth2AuthorizedClientService authorizedClientService;
    
    @Value("${smriti.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
                                        
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId().toUpperCase();

        String email = null;
        String name = oauth2User.getAttribute("name");

        if ("GOOGLE".equals(provider)) {
            email = oauth2User.getAttribute("email");
            Boolean emailVerified = oauth2User.getAttribute("email_verified");
            if (emailVerified == null || !emailVerified) {
                response.sendRedirect(frontendUrl + "/login?error=unverified-email");
                return;
            }
        } else if ("GITHUB".equals(provider)) {
            // For GitHub, we need to fetch the email explicitly to check if it's verified
            OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                    oauthToken.getAuthorizedClientRegistrationId(), oauthToken.getName());
            String accessToken = client.getAccessToken().getTokenValue();

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>("", headers);

            try {
                ResponseEntity<List<Map<String, Object>>> emailsResponse = restTemplate.exchange(
                        "https://api.github.com/user/emails", HttpMethod.GET, entity,
                        new ParameterizedTypeReference<>() {});

                List<Map<String, Object>> emails = emailsResponse.getBody();
                if (emails != null) {
                    for (Map<String, Object> emailObj : emails) {
                        Boolean primary = (Boolean) emailObj.get("primary");
                        Boolean verified = (Boolean) emailObj.get("verified");
                        if (Boolean.TRUE.equals(primary) && Boolean.TRUE.equals(verified)) {
                            email = (String) emailObj.get("email");
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                // Failed to fetch emails
            }

            if (email == null) {
                response.sendRedirect(frontendUrl + "/login?error=unverified-email");
                return;
            }
            
            if (name == null) {
                name = oauth2User.getAttribute("login");
            }
        }

        if (email == null || name == null) {
            response.sendRedirect(frontendUrl + "/login?error=oauth-failed");
            return;
        }

        try {
            User user = authService.findOrCreateOAuthUser(email, name, provider);
            
            if (user.getAcceptedTermsAt() == null) {
                // New user, terms pending
                String tempToken = jwtUtil.generateTokenWithPurpose(email, "oauth-terms-pending", 5 * 60 * 1000); // 5 mins
                response.sendRedirect(frontendUrl + "/accept-terms?token=" + tempToken);
            } else {
                // Returning user
                String token = jwtUtil.generateToken(email);
                response.sendRedirect(frontendUrl + "/oauth-callback?token=" + token);
            }
            
        } catch (AccountRequiresLinkException ex) {
            // Link account step-up
            String tempToken = jwtUtil.generateTokenWithPurpose(email, "oauth-link-pending", 10 * 60 * 1000, provider); // 10 mins
            response.sendRedirect(frontendUrl + "/link-account?token=" + tempToken + "&provider=" + provider.toLowerCase());
        }
    }
}
