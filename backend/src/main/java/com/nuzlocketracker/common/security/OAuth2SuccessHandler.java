package com.nuzlocketracker.common.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuzlocketracker.auth.dto.TokenResponse;
import com.nuzlocketracker.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@ConditionalOnBean(ClientRegistrationRepository.class)
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();

        String provider = oauthToken.getAuthorizedClientRegistrationId().toUpperCase();
        String providerUserId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Map<String, Object> profileMap = new HashMap<>();
        profileMap.put("name", name);
        profileMap.put("picture", oAuth2User.getAttribute("picture"));

        String profileJson;
        try {
            profileJson = objectMapper.writeValueAsString(profileMap);
        } catch (JsonProcessingException e) {
            profileJson = "{}";
        }

        TokenResponse tokens = authService.handleOAuthLogin(provider, providerUserId, email, name, profileJson);

        String redirectUrl = frontendUrl + "/oauth2/callback"
                + "?access_token=" + tokens.accessToken()
                + "&refresh_token=" + tokens.refreshToken();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
