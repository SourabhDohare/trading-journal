package com.tradingjournal.security;

import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Called by Spring Security after OAuth2 authentication succeeds.
 *
 * Steps:
 *  1. Reads the authenticated OAuth2User (populated by CustomOAuth2UserService)
 *  2. Looks up the User in MongoDB to get their internal ID
 *  3. Generates our own JWT using JwtTokenProvider
 *  4. Redirects the browser to the Angular frontend /auth/callback
 *     with token + email + name as query params
 *
 * The Angular OAuthCallbackComponent reads these params, stores the JWT,
 * and navigates to /dashboard — completing the login.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository   userRepository;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // ── Resolve email ──────────────────────────────────────────────────
        String email = oAuth2User.getAttribute("email");

        // GitHub with private email: CustomOAuth2UserService stored a noreply address.
        // We reconstruct it the same way to find the user.
        if (email == null || email.isBlank()) {
            Object rawId = oAuth2User.getAttribute("id");
            String providerId = rawId != null ? String.valueOf(rawId) : "";
            // Determine provider from request URI
            String uri      = request.getRequestURI();
            String provider = uri.contains("github") ? "github" : "google";
            email = providerId + "@" + provider + ".noreply";
        }

        email = email.toLowerCase().trim();
        log.info("OAuth2 success handler — email={}", email);

        // ── Find user in MongoDB ────────────────────────────────────────────
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found in MongoDB after OAuth2 success: " + email));

        // ── Generate JWT ────────────────────────────────────────────────────
        String token = jwtTokenProvider.generateToken(user.getId());

        // ── Build display name for the frontend welcome message ────────────
        String displayName = user.getDisplayName() != null
                ? user.getDisplayName()
                : (user.getFirstName() != null ? user.getFirstName() : "Trader");

        // ── Redirect to Angular callback page ─────────────────────────────
        String targetUrl = redirectUri
                + "?token=" + token
                + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                + "&name="  + URLEncoder.encode(displayName, StandardCharsets.UTF_8);

        log.info("OAuth2 redirecting to: {}", redirectUri);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
