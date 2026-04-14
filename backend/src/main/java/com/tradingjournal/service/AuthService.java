package com.tradingjournal.service;

import com.tradingjournal.dto.AuthDTO;
import com.tradingjournal.dto.UserDTO;
import com.tradingjournal.exception.BadRequestException;
import com.tradingjournal.model.User;
import com.tradingjournal.repository.UserRepository;
import com.tradingjournal.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtTokenProvider      tokenProvider;
    private final AuthenticationManager authenticationManager;

    // ── REGISTER ──────────────────────────────────────────────────────────
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {

        // Normalise email — prevents duplicate accounts with case differences
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BadRequestException("Email already registered: " + email);
        }

        User user = User.builder()
                .email(email)                                      // always stored lowercase
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(User.Role.TRADER)
                .active(true)
                .strictMode(false)
                .emailNotifications(true)
                .weeklyReportEmail(true)
                .timezone("Asia/Kolkata")
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", email);
        return buildResponse(user);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {

        String email = request.getEmail().toLowerCase().trim();

        // Case-insensitive lookup handles legacy emails like "Sourabhvijaydohare@gmail.com"
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        // ── Block OAuth-only accounts from password login ─────────────────
        // If account was created via Google/GitHub, password field is "" or null.
        // BCryptPasswordEncoder.matches("", "") throws IllegalArgumentException → 500.
        // Give a friendly error instead.
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            String provider = user.getProvider();
            String providerLabel = "google".equalsIgnoreCase(provider) ? "Google"
                                 : "github".equalsIgnoreCase(provider) ? "GitHub"
                                 : "social login";
            throw new BadRequestException(
                "This account was created with " + providerLabel + ". " +
                "Please use the 'Continue with " + providerLabel + "' button to sign in.");
        }

        // ── Verify password ───────────────────────────────────────────────
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getId(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid email or password.");
        } catch (Exception e) {
            log.error("Unexpected auth error for {}: {}", email, e.getMessage());
            throw new BadRequestException("Sign-in failed. Please try again.");
        }

        log.info("User logged in: {}", email);
        return buildResponse(user);
    }

    // ── REFRESH TOKEN ─────────────────────────────────────────────────────
    public AuthDTO.AuthResponse refresh(AuthDTO.RefreshRequest request) {
        if (!tokenProvider.validateToken(request.getRefreshToken())) {
            throw new BadRequestException("Invalid or expired refresh token.");
        }
        String userId = tokenProvider.getUserIdFromToken(request.getRefreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found."));
        return buildResponse(user);
    }

    // ── Builder ───────────────────────────────────────────────────────────
    private AuthDTO.AuthResponse buildResponse(User user) {
        String accessToken  = tokenProvider.generateToken(user.getId());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        UserDTO.Response userResp = new UserDTO.Response();
        userResp.setId(user.getId());
        userResp.setEmail(user.getEmail());
        userResp.setFirstName(user.getFirstName());
        userResp.setLastName(user.getLastName());
        userResp.setRole(user.getRole());
        userResp.setStrictMode(user.isStrictMode());
        userResp.setTimezone(user.getTimezone());
        userResp.setTradingConfig(user.getTradingConfig());
        userResp.setCreatedAt(user.getCreatedAt());

        AuthDTO.AuthResponse resp = new AuthDTO.AuthResponse();
        resp.setAccessToken(accessToken);
        resp.setRefreshToken(refreshToken);
        resp.setExpiresIn(tokenProvider.getExpirationMs());
        resp.setUser(userResp);
        return resp;
    }
}