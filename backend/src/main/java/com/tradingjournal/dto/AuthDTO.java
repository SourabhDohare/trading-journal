package com.tradingjournal.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

public class AuthDTO {

    // ── Existing ──────────────────────────────────────────────────────────

    @Data
    public static class RegisterRequest {
        @NotBlank private String firstName;
        @NotBlank private String lastName;
        @NotBlank @Email private String email;
        @NotBlank @Size(min = 8) private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long   expiresIn;
        private UserDTO.Response user;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank private String refreshToken;
    }

    // ── NEW: OTP endpoints ────────────────────────────────────────────────

    /** POST /auth/verify-email */
    @Data
    public static class VerifyEmailRequest {
        @NotBlank @Email  private String email;
        @NotBlank @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
        @Pattern(regexp = "\\d{6}", message = "OTP must be numeric")
        private String otp;
    }

    /** POST /auth/resend-otp */
    @Data
    public static class ResendOtpRequest {
        @NotBlank @Email private String email;
        // "EMAIL_VERIFICATION" or "PASSWORD_RESET"
        @NotBlank private String type;
    }

    /** POST /auth/forgot-password */
    @Data
    public static class ForgotPasswordRequest {
        @NotBlank @Email private String email;
    }

    /** POST /auth/reset-password */
    @Data
    public static class ResetPasswordRequest {
        @NotBlank @Email  private String email;
        @NotBlank @Size(min = 6, max = 6) @Pattern(regexp = "\\d{6}")
        private String otp;
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
        private String newPassword;
    }

    /** Response for OTP operations — simple status message */
    @Data
    public static class OtpResponse {
        private String status;
        private String message;

        public static OtpResponse ok(String message) {
            OtpResponse r = new OtpResponse();
            r.setStatus("ok");
            r.setMessage(message);
            return r;
        }
    }
}
