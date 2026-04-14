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

import java.util.Optional;

/**
 * Handles OAuth2 user info from Google and GitHub.
 *
 * Flow:
 *  1. Spring Security calls loadUser() after provider authenticates the user
 *  2. We extract email/name/avatar from the provider-specific attributes
 *  3. If user exists (by email) → update OAuth fields, keep existing data
 *  4. If user is new → create a full User document
 *  5. Save and return the OAuth2User — OAuth2SuccessHandler then generates JWT
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        // "google" or "github"
        String provider = request.getClientRegistration().getRegistrationId();

        String providerId, email, name, avatarUrl;

        if ("google".equals(provider)) {
            // Google attributes: sub, email, name, picture
            providerId = oAuth2User.getAttribute("sub");
            email      = oAuth2User.getAttribute("email");
            name       = oAuth2User.getAttribute("name");
            avatarUrl  = oAuth2User.getAttribute("picture");

        } else if ("github".equals(provider)) {
            // GitHub attributes: id (int), email (can be null if private), name or login, avatar_url
            Object rawId = oAuth2User.getAttribute("id");
            providerId   = rawId != null ? String.valueOf(rawId) : "gh_unknown";
            email        = oAuth2User.getAttribute("email");
            name         = oAuth2User.getAttribute("name") != null
                         ? oAuth2User.getAttribute("name")
                         : oAuth2User.getAttribute("login"); // fallback to username
            avatarUrl    = oAuth2User.getAttribute("avatar_url");

        } else {
            throw new OAuth2AuthenticationException("Unsupported OAuth2 provider: " + provider);
        }

        // GitHub users with private email — synthesise a unique non-null address
        if (email == null || email.isBlank()) {
            email = providerId + "@" + provider + ".noreply";
        }

        String finalEmail = email.toLowerCase().trim();
        log.info("OAuth2 login — provider={} email={}", provider, finalEmail);

        Optional<User> existing = userRepository.findByEmail(finalEmail);
        User user;

        if (existing.isPresent()) {
            // User already exists (may have registered with email/password before)
            user = existing.get();
            // Attach OAuth info if not already set
            if (user.getProvider() == null) {
                user.setProvider(provider);
                user.setProviderId(providerId);
            }
            if (user.getAvatarUrl() == null && avatarUrl != null) {
                user.setAvatarUrl(avatarUrl);
            }
            if (user.getDisplayName() == null && name != null) {
                user.setDisplayName(name);
            }

        } else {
            // Brand new user via OAuth — create full profile
            String[] parts = name != null ? name.split(" ", 2) : new String[]{"Trader", ""};
            user = User.builder()
                    .email(finalEmail)
                    .firstName(parts[0])
                    .lastName(parts.length > 1 ? parts[1] : "")
                    .displayName(name)
                    .avatarUrl(avatarUrl)
                    .provider(provider)
                    .providerId(providerId)
                    .password("")              // no password for OAuth-only users
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
