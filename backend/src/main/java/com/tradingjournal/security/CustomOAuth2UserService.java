package com.tradingjournal.security;

import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Enterprise-level OAuth2 user handling:
 *
 *  1. Uses case-insensitive email lookup to find existing users.
 *     This prevents duplicate accounts when legacy email has capital letters
 *     e.g. "Sourabhvijaydohare@gmail.com" → found when logging in with
 *          "sourabhvijaydohare@gmail.com" via Google.
 *
 *  2. If user exists → links their OAuth provider info, keeps all existing data.
 *  3. If user is new → creates a complete profile.
 *  4. Normalises email to lowercase on save so all future lookups are consistent.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);
        String provider = request.getClientRegistration().getRegistrationId(); // "google" | "github"

        // ── Extract attributes ─────────────────────────────────────────────
        String providerId, email, name, avatarUrl;

        if ("google".equals(provider)) {
            providerId = oAuth2User.getAttribute("sub");
            email      = oAuth2User.getAttribute("email");
            name       = oAuth2User.getAttribute("name");
            avatarUrl  = oAuth2User.getAttribute("picture");

        } else if ("github".equals(provider)) {
            Object rawId = oAuth2User.getAttribute("id");
            providerId   = rawId != null ? String.valueOf(rawId) : "gh_unknown";
            email        = oAuth2User.getAttribute("email");
            name         = oAuth2User.getAttribute("name") != null
                         ? oAuth2User.getAttribute("name")
                         : oAuth2User.getAttribute("login");
            avatarUrl    = oAuth2User.getAttribute("avatar_url");

        } else {
            throw new OAuth2AuthenticationException("Unsupported provider: " + provider);
        }

        // GitHub private email fallback
        if (email == null || email.isBlank()) {
            email = providerId + "@" + provider + ".noreply";
        }

        // Always normalise — prevents case-mismatch duplicates
        final String normalisedEmail = email.toLowerCase().trim();
        log.info("OAuth2 [{}] — email={}", provider, normalisedEmail);

        // ── Case-insensitive lookup: finds "Sourabhvijaydohare@gmail.com"
        //    when Google returns "sourabhvijaydohare@gmail.com" ─────────────
        User user = userRepository.findByEmailIgnoreCase(normalisedEmail).orElse(null);

        if (user != null) {
            // ── EXISTING USER — link OAuth, normalise email, keep all data ─
            user.setEmailVerified(true);
            log.info("Linking [{}] OAuth to existing account: {}", provider, user.getEmail());

            // Normalise the stored email to lowercase if it wasn't already
            if (!normalisedEmail.equals(user.getEmail())) {
                log.info("Normalising email: {} → {}", user.getEmail(), normalisedEmail);
                user.setEmail(normalisedEmail);
            }

            // Attach OAuth fields if not set
            if (user.getProvider() == null || user.getProvider().isBlank()) {
                user.setProvider(provider);
                user.setProviderId(providerId);
            }
            if (user.getAvatarUrl() == null && avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
            }
            // Only update display name if user hasn't set their own
            if ((user.getDisplayName() == null || user.getDisplayName().isBlank()) && name != null) {
                user.setDisplayName(name);
            }

        } else {
            // ── NEW USER via OAuth ─────────────────────────────────────────
            log.info("Creating new user via [{}] OAuth: {}", provider, normalisedEmail);
            String[] parts = name != null ? name.split(" ", 2) : new String[]{"Trader", ""};

            user = User.builder()
                    .emailVerified(true)
                    .email(normalisedEmail)
                    .firstName(parts[0])
                    .lastName(parts.length > 1 ? parts[1] : "")
                    .displayName(name)
                    .avatarUrl(avatarUrl)
                    .provider(provider)
                    .providerId(providerId)
                    .password("")              // OAuth-only — no password
                    .role(User.Role.TRADER)
                    .active(true)
                    .strictMode(false)
                    .emailNotifications(true)
                    .weeklyReportEmail(true)
                    .timezone("Asia/Kolkata")
                    .build();
        }

        userRepository.save(user);
        return oAuth2User;
    }
}