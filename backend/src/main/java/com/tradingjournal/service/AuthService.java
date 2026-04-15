package com.tradingjournal.service;

import com.tradingjournal.dto.AuthDTO;
import com.tradingjournal.dto.UserDTO;
import com.tradingjournal.exception.BadRequestException;
import com.tradingjournal.model.Otp;
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
    private final OtpService            otpService;

    // ── REGISTER — creates unverified user, sends OTP ─────────────────────
    public AuthDTO.OtpResponse register(AuthDTO.RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            // If account exists but unverified, allow re-sending OTP
            User existing = userRepository.findByEmailIgnoreCase(email).get();
            if (!existing.isEmailVerified()) {
                otpService.sendEmailVerificationOtp(email);
                return AuthDTO.OtpResponse.ok(
                        "Account already exists but not verified. " +
                        "A new verification code has been sent to " + email);
            }
            throw new BadRequestException("Email already registered: " + email);
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(User.Role.TRADER)
                .active(true)
                .emailVerified(false)  // ← must verify before login
                .strictMode(false)
                .emailNotifications(true)
                .weeklyReportEmail(true)
                .timezone("Asia/Kolkata")
                .build();

        userRepository.save(user);
        log.info("New user registered (unverified): {}", email);

        // Send 6-digit OTP via email
        otpService.sendEmailVerificationOtp(email);

        return AuthDTO.OtpResponse.ok(
                "Account created! A 6-digit verification code has been sent to " + email +
                ". Please verify your email to continue.");
    }

    // ── VERIFY EMAIL — OTP check, return JWT on success ───────────────────
    public AuthDTO.AuthResponse verifyEmail(AuthDTO.VerifyEmailRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Account not found."));

        if (user.isEmailVerified()) {
            // Already verified — just return a JWT so user lands on dashboard
            return buildResponse(user);
        }

        // Throws BadRequestException on wrong/expired OTP
        otpService.verifyOtp(email, request.getOtp(), Otp.OtpType.EMAIL_VERIFICATION);

        // Mark verified
        user.setEmailVerified(true);
        userRepository.save(user);
        log.info("Email verified: {}", email);

        return buildResponse(user);
    }

    // ── LOGIN — blocks unverified accounts, detects OAuth-only ───────────
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        // Block OAuth-only accounts (password = "" or null)
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            String provider    = user.getProvider();
            String label       = "google".equalsIgnoreCase(provider) ? "Google"
                               : "github".equalsIgnoreCase(provider) ? "GitHub"
                               : "social login";
            throw new BadRequestException(
                    "This account was created with " + label + ". " +
                    "Please use the 'Continue with " + label + "' button to sign in.");
        }

        // Block unverified accounts — resend OTP
        if (!user.isEmailVerified()) {
            otpService.sendEmailVerificationOtp(email);
            throw new BadRequestException(
                    "EMAIL_NOT_VERIFIED:" + email); // special code parsed by frontend
        }

        // Verify password
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getId(), request.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid email or password.");
        } catch (Exception e) {
            log.error("Auth error for {}: {}", email, e.getMessage());
            throw new BadRequestException("Sign-in failed. Please try again.");
        }

        log.info("User logged in: {}", email);
        return buildResponse(user);
    }

    // ── FORGOT PASSWORD — sends reset OTP ────────────────────────────────
    public AuthDTO.OtpResponse forgotPassword(AuthDTO.ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Always return same message — prevents email enumeration
        boolean exists = userRepository.existsByEmailIgnoreCase(email);
        if (exists) {
            User user = userRepository.findByEmailIgnoreCase(email).get();

            // OAuth-only accounts can't reset password
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                String provider = user.getProvider();
                String label    = "google".equalsIgnoreCase(provider) ? "Google" : "GitHub";
                throw new BadRequestException(
                        "This account uses " + label + " sign-in. " +
                        "Password reset is not available. Use '" + label + "' to sign in.");
            }

            otpService.sendPasswordResetOtp(email);
            log.info("Password reset OTP sent: {}", email);
        } else {
            log.warn("Password reset requested for unknown email: {}", email);
        }

        // Same message regardless — don't leak if email exists
        return AuthDTO.OtpResponse.ok(
                "If an account exists for " + email +
                ", a reset code has been sent. Check your inbox.");
    }

    // ── RESET PASSWORD — verify OTP then update password ─────────────────
    public AuthDTO.OtpResponse resetPassword(AuthDTO.ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Account not found."));

        // Verify OTP first
        otpService.verifyOtp(email, request.getOtp(), Otp.OtpType.PASSWORD_RESET);

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setEmailVerified(true); // ensure account is active after reset
        userRepository.save(user);

        log.info("Password reset complete: {}", email);
        return AuthDTO.OtpResponse.ok("Password updated successfully. You can now sign in.");
    }

    // ── RESEND OTP ────────────────────────────────────────────────────────
    public AuthDTO.OtpResponse resendOtp(AuthDTO.ResendOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if ("EMAIL_VERIFICATION".equals(request.getType())) {
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new BadRequestException("Account not found."));
            if (user.isEmailVerified()) {
                return AuthDTO.OtpResponse.ok("Email already verified.");
            }
            otpService.sendEmailVerificationOtp(email);
        } else if ("PASSWORD_RESET".equals(request.getType())) {
            otpService.sendPasswordResetOtp(email);
        } else {
            throw new BadRequestException("Invalid OTP type: " + request.getType());
        }

        return AuthDTO.OtpResponse.ok("A new code has been sent to " + email);
    }

    // ── REFRESH ───────────────────────────────────────────────────────────
    public AuthDTO.AuthResponse refresh(AuthDTO.RefreshRequest request) {
        if (!tokenProvider.validateToken(request.getRefreshToken()))
            throw new BadRequestException("Invalid or expired refresh token.");
        String userId = tokenProvider.getUserIdFromToken(request.getRefreshToken());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found."));
        return buildResponse(user);
    }

    // ── Private ───────────────────────────────────────────────────────────
    private AuthDTO.AuthResponse buildResponse(User user) {
        UserDTO.Response u = new UserDTO.Response();
        u.setId(user.getId()); u.setEmail(user.getEmail());
        u.setFirstName(user.getFirstName()); u.setLastName(user.getLastName());
        u.setRole(user.getRole()); u.setStrictMode(user.isStrictMode());
        u.setTimezone(user.getTimezone()); u.setTradingConfig(user.getTradingConfig());
        u.setCreatedAt(user.getCreatedAt());

        AuthDTO.AuthResponse resp = new AuthDTO.AuthResponse();
        resp.setAccessToken(tokenProvider.generateToken(user.getId()));
        resp.setRefreshToken(tokenProvider.generateRefreshToken(user.getId()));
        resp.setExpiresIn(tokenProvider.getExpirationMs());
        resp.setUser(u);
        return resp;
    }
}
