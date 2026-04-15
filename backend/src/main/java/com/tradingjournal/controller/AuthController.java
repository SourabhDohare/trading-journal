package com.tradingjournal.controller;

import com.tradingjournal.dto.AuthDTO;
import com.tradingjournal.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    // ── Existing ──────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register — creates account and sends email verification OTP")
    public ResponseEntity<AuthDTO.OtpResponse> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email + password (verified accounts only)")
    public ResponseEntity<AuthDTO.AuthResponse> login(
            @Valid @RequestBody AuthDTO.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<AuthDTO.AuthResponse> refresh(
            @Valid @RequestBody AuthDTO.RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    // ── OTP endpoints ─────────────────────────────────────────────────────

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with OTP — returns JWT on success")
    public ResponseEntity<AuthDTO.AuthResponse> verifyEmail(
            @Valid @RequestBody AuthDTO.VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP (60-second rate limit)")
    public ResponseEntity<AuthDTO.OtpResponse> resendOtp(
            @Valid @RequestBody AuthDTO.ResendOtpRequest request) {
        return ResponseEntity.ok(authService.resendOtp(request));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password reset OTP to email")
    public ResponseEntity<AuthDTO.OtpResponse> forgotPassword(
            @Valid @RequestBody AuthDTO.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with OTP verification")
    public ResponseEntity<AuthDTO.OtpResponse> resetPassword(
            @Valid @RequestBody AuthDTO.ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
