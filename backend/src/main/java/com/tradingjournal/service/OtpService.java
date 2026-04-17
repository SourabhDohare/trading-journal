package com.tradingjournal.service;

import com.tradingjournal.exception.BadRequestException;
import com.tradingjournal.model.Otp;
import com.tradingjournal.repository.OtpRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService   emailService;
    private final MongoTemplate  mongoTemplate;   // ← replaces @Update annotation

    private static final int OTP_EXPIRY_MINUTES  = 10;
    private static final int MAX_ATTEMPTS        = 3;
    private static final int RESEND_COOLDOWN_S   = 60;
    private static final int MAX_ACTIVE_PER_IP   = 3;
    private static final SecureRandom RANDOM     = new SecureRandom();

    // ── Public API ────────────────────────────────────────────────────────────

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

    // ── Verify ────────────────────────────────────────────────────────────────

    public void verifyOtp(String email, String rawCode, Otp.OtpType type) {
        String normEmail = normalize(email);

        Otp otp = otpRepository
                .findTopByEmailAndTypeAndStatusOrderByCreatedAtDesc(
                        normEmail, type, Otp.OtpStatus.PENDING)
                .orElseThrow(() -> new BadRequestException(
                        "No active OTP found. Please request a new one."));

        // Expiry check
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            markStatus(otp, Otp.OtpStatus.EXPIRED);
            audit(normEmail, type, "VERIFY_FAIL", "OTP expired");
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // Locked check
        if (otp.getStatus() == Otp.OtpStatus.LOCKED) {
            audit(normEmail, type, "VERIFY_FAIL", "Locked — too many attempts");
            throw new BadRequestException(
                    "Too many incorrect attempts. Please request a new OTP.");
        }

        // Hash comparison — never compare raw codes
        String submittedHash = sha256(rawCode.trim());
        if (!submittedHash.equals(otp.getCodeHash())) {
            int newAttempts = otp.getAttempts() + 1;
            otp.setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                markStatus(otp, Otp.OtpStatus.LOCKED);
                audit(normEmail, type, "VERIFY_FAIL",
                        "Locked after " + newAttempts + " failed attempts");
                throw new BadRequestException(
                        "Too many incorrect attempts. Please request a new OTP.");
            }

            otpRepository.save(otp);
            int remaining = MAX_ATTEMPTS - newAttempts;
            throw new BadRequestException(
                    "Incorrect OTP. " + remaining + " attempt(s) remaining.");
        }

        // Success
        otp.setStatus(Otp.OtpStatus.VERIFIED);
        otp.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(otp);
        audit(normEmail, type, "VERIFY_SUCCESS", "OTP verified");
        log.info("OTP verified [{}] for: {}", type, normEmail);
    }

    // ── Private: Generate + Send ──────────────────────────────────────────────

    private void generateAndSend(String email, Otp.OtpType type,
                                  String subject, String actionLabel) {
        String normEmail = normalize(email);
        String requestIp = resolveClientIp();

        // Cooldown check
        otpRepository
                .findTopByEmailAndTypeAndStatusOrderByCreatedAtDesc(
                        normEmail, type, Otp.OtpStatus.PENDING)
                .ifPresent(existing -> {
                    long seconds = java.time.Duration
                            .between(existing.getCreatedAt(), LocalDateTime.now())
                            .getSeconds();
                    if (seconds < RESEND_COOLDOWN_S) {
                        long wait = RESEND_COOLDOWN_S - seconds;
                        throw new BadRequestException(
                                "Please wait " + wait + " seconds before requesting another OTP.");
                    }
                });

        // IP rate limit
        long activeFromIp = otpRepository.countByRequestIpAndTypeAndStatus(
                requestIp, type, Otp.OtpStatus.PENDING);
        if (activeFromIp >= MAX_ACTIVE_PER_IP) {
            audit(normEmail, type, "RATE_LIMITED", "IP " + requestIp + " exceeded limit");
            throw new BadRequestException(
                    "Too many OTP requests from this device. Please wait and try again.");
        }

        // Revoke all previous PENDING OTPs — using MongoTemplate (no @Update annotation needed)
        revokeAllPending(normEmail, type);

        // Generate — store HASH only
        String rawCode  = generateCode();
        String codeHash = sha256(rawCode);
        LocalDateTime now = LocalDateTime.now();

        Otp otp = Otp.builder()
                .email(normEmail)
                .codeHash(codeHash)
                .type(type)
                .status(Otp.OtpStatus.PENDING)
                .attempts(0)
                .requestIp(requestIp)
                .userAgent(resolveUserAgent())
                .createdAt(now)
                .expiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        otpRepository.save(otp);
        audit(normEmail, type, "ISSUED", "IP: " + requestIp);

        // Send email — raw code goes here, then out of scope forever
        try {
            emailService.sendHtmlEmailSync(normEmail, subject,
                    buildEmailHtml(rawCode, actionLabel));
        } catch (Exception e) {
            log.warn("⚠ OTP email FAILED for {} — {}", normEmail, e.getMessage());
            log.warn("⚠ DEV — OTP: {} ({}min)", rawCode, OTP_EXPIRY_MINUTES);
        }
    }

    // ── MongoTemplate ops (replaces @Update annotation entirely) ─────────────

    /**
     * Marks all PENDING OTPs for email+type as REVOKED.
     * Uses MongoTemplate.updateMulti() — 100% reliable, no annotation magic.
     */
    private void revokeAllPending(String email, Otp.OtpType type) {
        Query q = Query.query(
                Criteria.where("email").is(email)
                        .and("type").is(type)
                        .and("status").is(Otp.OtpStatus.PENDING));
        Update u = new Update().set("status", Otp.OtpStatus.REVOKED);
        mongoTemplate.updateMulti(q, u, Otp.class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void markStatus(Otp otp, Otp.OtpStatus status) {
        otp.setStatus(status);
        otpRepository.save(otp);
    }

    private void audit(String email, Otp.OtpType type, String event, String detail) {
        log.info("[SECURITY_AUDIT] event={} type={} email={} detail=\"{}\"",
                event, type, email, detail);
    }

    private String generateCode() {
        return String.valueOf(RANDOM.nextInt(900000) + 100000);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }

    private String normalize(String email) {
        return email == null ? "" : email.toLowerCase().trim();
    }

    private String resolveClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest req = attrs.getRequest();
            String forwarded = req.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank())
                return forwarded.split(",")[0].trim();
            return req.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String resolveUserAgent() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            String ua = attrs.getRequest().getHeader("User-Agent");
            return ua != null && ua.length() > 200 ? ua.substring(0, 200) : ua;
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String buildEmailHtml(String code, String actionLabel) {
        String digits = code.chars()
                .mapToObj(c ->
                    "<td style='padding:0 4px'>"
                    + "<div style='width:44px;height:56px;line-height:56px;text-align:center;"
                    + "background:#111827;border:1px solid #1e3a4a;border-radius:10px;"
                    + "font-size:28px;font-weight:900;color:#5EEAD4;font-family:monospace;"
                    + "display:inline-block'>" + (char) c + "</div></td>")
                .reduce("", String::concat);

        String shieldSvg =
            "<svg width='36' height='43' viewBox='0 0 100 120' fill='none' xmlns='http://www.w3.org/2000/svg'>"
            + "<path d='M50 15L15 30V65C15 85 50 105 50 105C50 105 85 85 85 65V30L50 15Z' fill='#0D9488'/>"
            + "<path d='M35 68L48 50L58 60L75 35' stroke='#5EEAD4' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/>"
            + "<circle cx='75' cy='35' r='7' fill='white'/></svg>";

        return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'>"
            + "<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
            + "<body style='font-family:Arial,sans-serif;background:#070b14;color:#e2e8f0;margin:0;padding:0'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:40px 16px'>"
            + "<table width='560' cellpadding='0' cellspacing='0' style='max-width:560px'>"
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<table cellpadding='0' cellspacing='0'><tr>"
            + "<td style='padding-right:12px;vertical-align:middle'>" + shieldSvg + "</td>"
            + "<td style='vertical-align:middle'>"
            + "<div style='font-size:26px;font-weight:700;color:white'>Market<span style='color:#5EEAD4;font-weight:400'>Saga</span></div>"
            + "<div style='font-size:7px;font-weight:800;color:#475569;letter-spacing:3px;margin-top:2px'>TRADE WITH CLARITY</div>"
            + "</td></tr></table></td></tr>"
            + "<tr><td style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:36px'>"
            + "<table width='100%' cellpadding='0' cellspacing='0'>"
            + "<tr><td align='center' style='padding-bottom:8px'>"
            + "<div style='font-size:11px;background:rgba(13,148,136,.15);color:#5EEAD4;"
            + "border:1px solid rgba(13,148,136,.3);border-radius:100px;padding:5px 14px;"
            + "font-weight:800;letter-spacing:2px;display:inline-block'>🔐 VERIFICATION CODE</div>"
            + "</td></tr>"
            + "<tr><td align='center' style='padding:12px 0 6px'>"
            + "<div style='font-size:22px;font-weight:700;color:#e2e8f0'>Enter this code to " + actionLabel + "</div>"
            + "</td></tr>"
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<div style='font-size:14px;color:#475569'>Valid for <strong style='color:#94a3b8'>10 minutes</strong>. Do not share.</div>"
            + "</td></tr>"
            + "<tr><td align='center' style='padding-bottom:28px'>"
            + "<table cellpadding='0' cellspacing='0'><tr>" + digits + "</tr></table>"
            + "</td></tr>"
            + "<tr><td style='border-top:1px solid #1e2433;padding-top:24px'></td></tr>"
            + "<tr><td style='padding-top:16px'>"
            + "<table width='100%' style='background:rgba(245,158,11,.06);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0'>"
            + "<tr><td style='padding:12px 16px'><div style='font-size:12px;color:#fbbf24'>"
            + "<strong>Security notice:</strong> Market Saga will never ask for this code. If you did not request this, ignore this email."
            + "</div></td></tr></table></td></tr>"
            + "</table></td></tr>"
            + "<tr><td align='center' style='padding-top:24px'>"
            + "<p style='font-size:11px;color:#334155'>Sent from <a href='https://marketsaga.site' style='color:#0D9488'>marketsaga.site</a></p>"
            + "</td></tr></table></td></tr></table></body></html>";
    }
}