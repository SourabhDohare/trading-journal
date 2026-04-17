package com.tradingjournal.service;

import com.tradingjournal.dto.FeedbackDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final EmailService emailService;

    @Value("${MAIL_FROM:noreply@marketsaga.site}")
    private String adminEmail;

    // ── Contact form ──────────────────────────────────────────────────────────

    public void handleContact(FeedbackDTO.ContactRequest req) {
        log.info("[CONTACT] subject='{}' from='{}'", req.getSubject(), req.getEmail());

        String html = buildContactEmail(req);
        String subject = "[MarketSaga Contact] " + req.getSubject()
                + (req.getEmail() != null ? " — " + req.getEmail() : "");

        try {
            emailService.sendHtmlEmail(adminEmail, subject, html);
        } catch (Exception e) {
            // Non-fatal — log and continue. Contact was received, just email notification failed.
            log.error("Failed to send contact notification email: {}", e.getMessage());
        }
    }

    // ── Feedback form ─────────────────────────────────────────────────────────

    public void handleFeedback(FeedbackDTO.FeedbackRequest req) {
        log.info("[FEEDBACK] category='{}' rating={} from='{}'",
                req.getCategory(), req.getRating(), req.getEmail());

        String html = buildFeedbackEmail(req);
        String stars = "★".repeat(req.getRating()) + "☆".repeat(5 - req.getRating());
        String subject = "[MarketSaga Feedback] " + stars + " · " + req.getCategory();

        try {
            emailService.sendHtmlEmail(adminEmail, subject, html);
        } catch (Exception e) {
            log.error("Failed to send feedback notification email: {}", e.getMessage());
        }
    }

    // ── Email builders ────────────────────────────────────────────────────────

    private String buildContactEmail(FeedbackDTO.ContactRequest req) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#070b14;color:#e2e8f0;padding:0;margin:0'>"
            + "<div style='max-width:600px;margin:0 auto;padding:40px 24px'>"
            + header()
            + "<div style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:28px'>"
            + "<div style='font-size:11px;font-family:monospace;color:#5EEAD4;letter-spacing:2px;margin-bottom:16px'>📬 NEW CONTACT MESSAGE</div>"
            + row("From",    req.getName() != null ? req.getName() : "—")
            + row("Email",   req.getEmail() != null ? req.getEmail() : "—")
            + row("Subject", req.getSubject() != null ? req.getSubject() : "—")
            + "<div style='margin-top:16px;padding:16px;background:#070b14;border:1px solid #1e2433;border-radius:8px;font-size:14px;color:#94a3b8;line-height:1.6;white-space:pre-wrap'>"
            + escapeHtml(req.getMessage() != null ? req.getMessage() : "") + "</div>"
            + "</div></div></body></html>";
    }

    private String buildFeedbackEmail(FeedbackDTO.FeedbackRequest req) {
        String stars = "★".repeat(Math.max(0, Math.min(5, req.getRating())))
                     + "☆".repeat(5 - Math.max(0, Math.min(5, req.getRating())));
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#070b14;color:#e2e8f0;padding:0;margin:0'>"
            + "<div style='max-width:600px;margin:0 auto;padding:40px 24px'>"
            + header()
            + "<div style='background:#0d1117;border:1px solid #1e2433;border-radius:16px;padding:28px'>"
            + "<div style='font-size:11px;font-family:monospace;color:#5EEAD4;letter-spacing:2px;margin-bottom:16px'>💡 NEW FEEDBACK SUBMISSION</div>"
            + "<div style='font-size:28px;margin-bottom:16px'>" + stars + "</div>"
            + row("Rating",   req.getRating() + " / 5")
            + row("Category", req.getCategory() != null ? req.getCategory() : "—")
            + row("From",     req.getName()    != null ? req.getName()    : "Anonymous")
            + row("Email",    req.getEmail()   != null ? req.getEmail()   : "—")
            + section("What's Working",   req.getWhatWorks())
            + section("Needs Improvement", req.getImprovements())
            + section("Feature Request",   req.getFeatureRequest())
            + "</div></div></body></html>";
    }

    private String header() {
        return "<div style='text-align:center;margin-bottom:24px'>"
            + "<span style='font-size:22px;font-weight:800;color:white'>Market<span style='color:#5EEAD4;font-weight:400'>Saga</span></span>"
            + "<div style='font-size:7px;font-weight:800;color:#475569;letter-spacing:3px;margin-top:3px'>TRADE WITH CLARITY</div>"
            + "</div>";
    }

    private String row(String label, String value) {
        return "<div style='display:flex;gap:16px;padding:10px 0;border-bottom:1px solid #111827'>"
            + "<span style='font-size:12px;font-family:monospace;color:#475569;min-width:100px'>" + label + "</span>"
            + "<span style='font-size:14px;color:#94a3b8'>" + escapeHtml(value) + "</span>"
            + "</div>";
    }

    private String section(String label, String content) {
        if (content == null || content.isBlank()) return "";
        return "<div style='margin-top:16px'>"
            + "<div style='font-size:11px;font-family:monospace;color:#475569;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase'>" + label + "</div>"
            + "<div style='padding:14px;background:#070b14;border:1px solid #1e2433;border-radius:8px;font-size:14px;color:#94a3b8;line-height:1.6;white-space:pre-wrap'>"
            + escapeHtml(content) + "</div></div>";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;")
                    .replace(">", "&gt;").replace("\"", "&quot;");
    }
}