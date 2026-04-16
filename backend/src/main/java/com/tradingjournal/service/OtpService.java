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
        generateAndSend(email, Otp.OtpType.EMAIL_VERIFICATION,
                "Market Saga — Verify your email",
                "verify your Market Saga account");
    }

    public void sendPasswordResetOtp(String email) {
        generateAndSend(email, Otp.OtpType.PASSWORD_RESET,
                "Market Saga — Reset your password",
                "reset your Market Saga password");
    }

    // ── Verify ────────────────────────────────────────────────────────────

    public void verifyOtp(String email, String code, Otp.OtpType type) {
        String normEmail = normalize(email);

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
            throw new BadRequestException("Too many incorrect attempts. Please request a new OTP.");
        }

        if (!otp.getCode().equals(code.trim())) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            int remaining = MAX_ATTEMPTS - otp.getAttempts();
            throw new BadRequestException("Incorrect OTP. " + remaining + " attempt(s) remaining.");
        }

        otp.setUsed(true);
        otpRepository.save(otp);
        log.info("OTP verified [{}] for: {}", type, normEmail);
    }

    // ── Private ───────────────────────────────────────────────────────────

    private void generateAndSend(String email, Otp.OtpType type,
                                  String subject, String actionLabel) {
        String normEmail = normalize(email);

        // Rate limit — 60 second cooldown
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

        try {
            emailService.sendHtmlEmailSync(normEmail, subject, buildEmailHtml(code, actionLabel));
            log.info("OTP email sent to: {}", normEmail);
        } catch (Exception e) {
            log.warn("⚠ OTP email FAILED for {} — {}", normEmail, e.getMessage());
            log.warn("⚠ OTP for manual testing: {} (expires {}min)", code, OTP_EXPIRY_MINUTES);
        }
    }

    private String generateCode() {
        return String.valueOf(RANDOM.nextInt(900000) + 100000);
    }

    private String normalize(String email) {
        return email == null ? "" : email.toLowerCase().trim();
    }

    // ── Email HTML — Market Saga branded ─────────────────────────────────

    private String buildEmailHtml(String code, String actionLabel) {
        // Individual digit boxes
        String digits = code.chars()
                .mapToObj(c ->
                    "<td style='padding:0 4px'>"
                    + "<div style='width:44px;height:56px;line-height:56px;text-align:center;"
                    + "background:#111827;border:1px solid #1e3a4a;border-radius:10px;"
                    + "font-size:28px;font-weight:900;color:#5EEAD4;font-family:monospace;"
                    + "display:inline-block'>" + (char) c + "</div></td>")
                .reduce("", String::concat);

        // Shield SVG as base64-safe inline SVG in email
        String shieldSvg =
            "<svg width='36' height='43' viewBox='0 0 100 120' fill='none' xmlns='http://www.w3.org/2000/svg'>"
            + "<path d='M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z' fill='#0D9488'/>"
            + "<path d='M35 68L48 50L58 60L75 35' stroke='#5EEAD4' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>"
            + "<circle cx='75' cy='35' r='7' fill='white'/>"
            + "</svg>";

        return "<!DOCTYPE html>"
            + "<html lang='en'><head><meta charset='UTF-8'>"
            + "<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
            + "<body style='font-family:Arial,sans-serif;background:#070b14;color:#e2e8f0;margin:0;padding:0'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:40px 16px'>"
            + "<table width='560' cellpadding='0' cellspacing='0' style='max-width:560px'>"

            // ── Logo header ──────────────────────────────────────────────
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<table cellpadding='0' cellspacing='0'><tr>"
            + "<td style='padding-right:12px;vertical-align:middle'>" + shieldSvg + "</td>"
            + "<td style='vertical-align:middle'>"
            + "<div style='font-size:26px;font-weight:700;color:white;letter-spacing:-0.5px;font-family:Arial,sans-serif'>"
            + "Market<span style='color:#5EEAD4;font-weight:400'>Saga</span></div>"
            + "<div style='font-size:7px;font-weight:800;color:#475569;letter-spacing:3px;margin-top:2px'>TRADE WITH CLARITY</div>"
            + "</td></tr></table></td></tr>"

            // ── Card ─────────────────────────────────────────────────────
            + "<tr><td style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:36px'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'>"

            // Title
            + "<tr><td align='center' style='padding-bottom:8px'>"
            + "<div style='font-size:11px;background:rgba(13,148,136,.15);color:#5EEAD4;"
            + "border:1px solid rgba(13,148,136,.3);border-radius:100px;padding:5px 14px;"
            + "font-weight:800;letter-spacing:2px;display:inline-block'>🔐 VERIFICATION CODE</div>"
            + "</td></tr>"
            + "<tr><td align='center' style='padding:12px 0 6px'>"
            + "<div style='font-size:22px;font-weight:700;color:#e2e8f0'>Enter this code to " + actionLabel + "</div>"
            + "</td></tr>"
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<div style='font-size:14px;color:#475569;line-height:1.6'>"
            + "Valid for <strong style='color:#94a3b8'>10 minutes</strong>. Do not share this code with anyone.</div>"
            + "</td></tr>"

            // OTP digits
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<table cellpadding='0' cellspacing='0'><tr>" + digits + "</tr></table>"
            + "</td></tr>"

            // Divider
            + "<tr><td style='border-top:1px solid #1e2433;padding-top:24px'></td></tr>"

            // Security notice
            + "<tr><td style='padding-top:16px'>"
            + "<table width='100%' style='background:rgba(245,158,11,.06);border-left:3px solid #f59e0b;"
            + "border-radius:0 8px 8px 0' cellpadding='0' cellspacing='0'>"
            + "<tr><td style='padding:12px 16px'>"
            + "<div style='font-size:12px;color:#fbbf24;line-height:1.6'>"
            + "<strong>Security notice:</strong> Market Saga will never call or message you to ask "
            + "for this code. If you did not request this, please ignore this email.</div>"
            + "</td></tr></table></td></tr>"

            + "</table></td></tr>"

            // Footer
            + "<tr><td align='center' style='padding-top:24px'>"
            + "<table cellpadding='0' cellspacing='0'><tr>"
            + "<td style='padding-right:8px'>" + shieldSvg.replace("width='36' height='43'","width='16' height='19'").replace("opacity","display") + "</td>"
            + "<td style='font-size:11px;color:#334155;font-family:Arial'>"
            + "Sent from <a href='https://marketsaga.site' style='color:#0D9488;text-decoration:none'>marketsaga.site</a>"
            + " · <a href='https://marketsaga.site' style='color:#334155;text-decoration:none'>Unsubscribe</a>"
            + "</td></tr></table>"
            + "</td></tr>"

            + "</table></td></tr></table>"
            + "</body></html>";
    }
}
