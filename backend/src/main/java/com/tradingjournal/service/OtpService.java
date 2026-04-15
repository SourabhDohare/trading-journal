package com.tradingjournal.service;

import com.tradingjournal.exception.BadRequestException;
import com.tradingjournal.model.Otp;
import com.tradingjournal.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Enterprise OTP service.
 *
 * Security guarantees:
 *  - Cryptographically secure random (SecureRandom, not Math.random)
 *  - Max 3 wrong attempts before OTP is invalidated
 *  - 10-minute expiry
 *  - Old OTPs deleted before issuing new one (no replay)
 *  - Rate limit: 60-second cooldown before resend
 *  - OTP marked `used=true` immediately on first valid use (no replay)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService  emailService;

    private static final int    OTP_EXPIRY_MINUTES = 10;
    private static final int    MAX_ATTEMPTS       = 3;
    private static final int    RESEND_COOLDOWN_S  = 60;
    private static final SecureRandom RANDOM       = new SecureRandom();

    // ── Generate and send ─────────────────────────────────────────────────

    public void sendEmailVerificationOtp(String email) {
        send(email, Otp.OtpType.EMAIL_VERIFICATION,
                "TradePulse — Verify your email",
                "verify your TradePulse account");
    }

    public void sendPasswordResetOtp(String email) {
        send(email, Otp.OtpType.PASSWORD_RESET,
                "TradePulse — Reset your password",
                "reset your TradePulse password");
    }

    // ── Verify ────────────────────────────────────────────────────────────

    /**
     * Validates the OTP.
     * @throws BadRequestException with specific message on failure
     */
    public void verifyOtp(String email, String code, Otp.OtpType type) {
        String normEmail = email.toLowerCase().trim();

        Otp otp = otpRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(normEmail, type)
                .orElseThrow(() -> new BadRequestException(
                        "No active OTP found. Please request a new one."));

        // Expiry check (belt-and-suspenders — MongoDB TTL also handles this)
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.deleteAllByEmailAndType(normEmail, type);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // Brute-force protection
        if (otp.getAttempts() >= MAX_ATTEMPTS) {
            otpRepository.deleteAllByEmailAndType(normEmail, type);
            throw new BadRequestException(
                    "Too many incorrect attempts. Please request a new OTP.");
        }

        if (!otp.getCode().equals(code.trim())) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            int remaining = MAX_ATTEMPTS - otp.getAttempts();
            throw new BadRequestException(
                    "Incorrect OTP. " + remaining + " attempt(s) remaining.");
        }

        // Valid — mark as used immediately (no replay)
        otp.setUsed(true);
        otpRepository.save(otp);
        log.info("OTP verified [{}] for: {}", type, normEmail);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private void send(String email, Otp.OtpType type,
                      String subject, String actionLabel) {

        String normEmail = email.toLowerCase().trim();

        // Rate limiting — prevent spam (60-second cooldown)
        otpRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(normEmail, type)
                .ifPresent(existing -> {
                    long secondsSince = java.time.Duration
                            .between(existing.getCreatedAt(), LocalDateTime.now())
                            .getSeconds();
                    if (secondsSince < RESEND_COOLDOWN_S) {
                        throw new BadRequestException(
                                "Please wait " + (RESEND_COOLDOWN_S - secondsSince)
                                + " seconds before requesting another OTP.");
                    }
                });

        // Delete old OTPs for this email+type before issuing new one
        otpRepository.deleteAllByEmailAndType(normEmail, type);

        String code = generateCode();
        LocalDateTime now = LocalDateTime.now();

        Otp otp = Otp.builder()
                .email(normEmail)
                .code(code)
                .type(type)
                .used(false)
                .attempts(0)
                .createdAt(now)
                .expiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        otpRepository.save(otp);
        log.info("OTP generated [{}] for: {} (expires in {}m)", type, normEmail, OTP_EXPIRY_MINUTES);

        emailService.sendHtmlEmail(normEmail, subject, buildEmailHtml(code, actionLabel));
    }

    /** Cryptographically secure 6-digit OTP */
    private String generateCode() {
        int n = RANDOM.nextInt(900000) + 100000; // 100000–999999
        return String.valueOf(n);
    }

    private String buildEmailHtml(String code, String actionLabel) {
        // Split code into individual digits for large display
        String digits = code.chars()
                .mapToObj(c -> "<span style='display:inline-block;width:44px;height:56px;"
                        + "line-height:56px;text-align:center;background:#111827;"
                        + "border:1px solid #1e2433;border-radius:10px;"
                        + "font-size:28px;font-weight:800;color:#e2e8f0;"
                        + "margin:0 4px;font-family:monospace'>"
                        + (char) c + "</span>")
                .reduce("", String::concat);

        return "<!DOCTYPE html><html><body style='font-family:Inter,sans-serif;"
                + "background:#0a0e1a;color:#e2e8f0;padding:0;margin:0'>"
                + "<div style='max-width:520px;margin:0 auto;padding:48px 24px'>"

                // Logo
                + "<div style='text-align:center;margin-bottom:32px'>"
                + "<span style='font-size:28px;font-weight:900;"
                + "background:linear-gradient(135deg,#3b82f6,#8b5cf6);"
                + "-webkit-background-clip:text;-webkit-text-fill-color:transparent'>"
                + "TradePulse</span></div>"

                // Card
                + "<div style='background:#0d1117;border:1px solid #1e2433;"
                + "border-radius:16px;padding:40px 36px;text-align:center'>"

                + "<div style='font-size:40px;margin-bottom:16px'>🔐</div>"
                + "<h2 style='margin:0 0 8px;font-size:22px;color:#e2e8f0'>Verification Code</h2>"
                + "<p style='color:#64748b;font-size:14px;margin:0 0 32px;line-height:1.6'>"
                + "Use this 6-digit code to " + actionLabel + ".<br>"
                + "Valid for <strong style='color:#94a3b8'>10 minutes</strong>.</p>"

                // OTP digits
                + "<div style='margin:0 0 28px'>" + digits + "</div>"

                // Warning
                + "<div style='background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;"
                + "border-radius:0 8px 8px 0;padding:12px 16px;text-align:left;margin-bottom:20px'>"
                + "<p style='color:#fbbf24;margin:0;font-size:13px;line-height:1.6'>"
                + "<strong>Security:</strong> Never share this code. TradePulse will never ask "
                + "for your OTP via call or message. This code expires in 10 minutes.</p></div>"

                + "<p style='color:#334155;font-size:12px;margin:0'>"
                + "Didn't request this? You can safely ignore this email.</p>"
                + "</div>"

                + "<p style='text-align:center;color:#1e2433;font-size:12px;margin-top:24px'>"
                + "TradePulse · trading-journal-plum-gamma.vercel.app</p>"
                + "</div></body></html>";
    }
}
