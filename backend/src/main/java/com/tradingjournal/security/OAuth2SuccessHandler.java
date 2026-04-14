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

        // ── Resolve email — must be effectively final before lambda use ────
        String rawEmail = oAuth2User.getAttribute("email");

        final String resolvedEmail;
        if (rawEmail == null || rawEmail.isBlank()) {
            // GitHub with private email: reconstruct the noreply address
            Object rawId    = oAuth2User.getAttribute("id");
            String id       = rawId != null ? String.valueOf(rawId) : "";
            String provider = request.getRequestURI().contains("github") ? "github" : "google";
            resolvedEmail   = id + "@" + provider + ".noreply";
        } else {
            resolvedEmail = rawEmail.toLowerCase().trim();
        }

        log.info("OAuth2 success handler — email={}", resolvedEmail);

        // ── Find user — resolvedEmail is effectively final, safe in lambda ─
        User user = userRepository.findByEmail(resolvedEmail)
                .orElseThrow(() -> new RuntimeException(
                        "User not found after OAuth2 success: " + resolvedEmail));

        // ── Generate JWT ───────────────────────────────────────────────────
        String token = jwtTokenProvider.generateToken(user.getId());

        String displayName = user.getDisplayName() != null
                ? user.getDisplayName()
                : (user.getFirstName() != null ? user.getFirstName() : "Trader");

        // ── Redirect to Angular /auth/callback ────────────────────────────
        String targetUrl = redirectUri
                + "?token=" + token
                + "&email=" + URLEncoder.encode(resolvedEmail, StandardCharsets.UTF_8)
                + "&name="  + URLEncoder.encode(displayName,   StandardCharsets.UTF_8);

        log.info("OAuth2 redirecting to: {}", redirectUri);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}