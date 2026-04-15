package com.tradingjournal.service;

import com.tradingjournal.exception.BadRequestException;
import com.tradingjournal.model.Otp;
import com.tradingjournal.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

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

    // ── Public API ────────────────────────────────────────────────────────

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

    public void verifyOtp(String email, String code, Otp.OtpType type) {
        String normEmail = email.toLowerCase().trim();

        Otp otp = otpRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(normEmail, type)
                .orElseThrow(() -> new BadRequestException(
                        "No active OTP found. Please request a new one."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.deleteAllByEmailAndType(normEmail, type);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

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

        otp.setUsed(true);
        otpRepository.save(otp);
        log.info("OTP verified [{}] for: {}", type, normEmail);
    }

    // ── Private ───────────────────────────────────────────────────────────

    private void send(String email, Otp.OtpType type,
                      String subject, String actionLabel) {
        String normEmail = email.toLowerCase().trim();

        // 60-second cooldown
        otpRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(normEmail, type)
                .ifPresent(existing -> {
                    long secondsSince = java.time.Duration
                            .between(existing.getCreatedAt(), LocalDateTime.now())
                            .getSeconds();
                    if (secondsSince < RESEND_COOLDOWN_S) {
                        long wait = RESEND_COOLDOWN_S - secondsSince;
                        throw new BadRequestException(
                                "Please wait " + wait + " seconds before requesting another OTP.");
                    }
                });

        otpRepository.deleteAllByEmailAndType(normEmail, type);

        String code       = generateCode();
        LocalDateTime now = LocalDateTime.now();

        Otp otp = Otp.builder()
                .email(normEmail).code(code).type(type)
                .used(false).attempts(0)
                .createdAt(now).expiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        otpRepository.save(otp);
        log.info("OTP generated [{}] for: {} (expires {}min)", type, normEmail, OTP_EXPIRY_MINUTES);

        // FIX: use sendHtmlEmailSync() not sendHtmlEmail()
        // sendHtmlEmail() is @Async — exceptions are silently swallowed
        // sendHtmlEmailSync() lets us catch the error and log the OTP code for debugging
        try {
            emailService.sendHtmlEmailSync(normEmail, subject, buildEmailHtml(code, actionLabel));
            log.info("OTP email delivered to: {}", normEmail);
        } catch (Exception e) {
            // Domain is verified — this should not fail in production
            // But if it does, log the OTP so you can check Render logs
            log.warn("⚠ OTP email FAILED for {} — Error: {}", normEmail, e.getMessage());
            log.warn("⚠ OTP for manual testing: {} (expires {}min)", code, OTP_EXPIRY_MINUTES);
            // Don't rethrow — OTP is saved, user can still verify
        }
    }

    private String generateCode() {
        return String.valueOf(RANDOM.nextInt(900000) + 100000);
    }

    private String buildEmailHtml(String code, String actionLabel) {
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
                + "<div style='text-align:center;margin-bottom:32px'>"
                + "<span style='font-size:28px;font-weight:900;"
                + "background:linear-gradient(135deg,#3b82f6,#8b5cf6);"
                + "-webkit-background-clip:text;-webkit-text-fill-color:transparent'>"
                + "TradePulse</span></div>"
                + "<div style='background:#0d1117;border:1px solid #1e2433;"
                + "border-radius:16px;padding:40px 36px;text-align:center'>"
                + "<div style='font-size:40px;margin-bottom:16px'>🔐</div>"
                + "<h2 style='margin:0 0 8px;font-size:22px;color:#e2e8f0'>Verification Code</h2>"
                + "<p style='color:#64748b;font-size:14px;margin:0 0 32px;line-height:1.6'>"
                + "Use this 6-digit code to " + actionLabel + ".<br>"
                + "Valid for <strong style='color:#94a3b8'>10 minutes</strong>.</p>"
                + "<div style='margin:0 0 28px'>" + digits + "</div>"
                + "<div style='background:rgba(245,158,11,.08);border-left:3px solid #f59e0b;"
                + "border-radius:0 8px 8px 0;padding:12px 16px;text-align:left;margin-bottom:20px'>"
                + "<p style='color:#fbbf24;margin:0;font-size:13px;line-height:1.6'>"
                + "<strong>Security:</strong> Never share this code. TradePulse will never ask "
                + "for your OTP. This code expires in 10 minutes.</p></div>"
                + "<p style='color:#334155;font-size:12px;margin:0'>"
                + "Didn't request this? You can safely ignore this email.</p>"
                + "</div>"
                + "<p style='text-align:center;color:#1e2433;font-size:12px;margin-top:24px'>"
                + "Sent from noreply@marketsaga.site · TradePulse</p>"
                + "</div></body></html>";
    }
}