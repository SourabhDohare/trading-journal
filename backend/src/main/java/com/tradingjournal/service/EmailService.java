package com.tradingjournal.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    // FIX: default changed to noreply@marketsaga.site (domain is now verified)
    @Value("${MAIL_FROM:noreply@marketsaga.site}")
    private String mailFrom;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RESEND_URL  = "https://api.resend.com/emails";

    // ── @Async — fire and forget (trade notifications, weekly reports) ─────
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        String recipient = normalize(to);
        if (!apiKeyPresent(recipient)) return;
        try {
            doSend(recipient, subject, htmlBody, null, null);
            log.info("Email sent to {} — {}", recipient, subject);
        } catch (Exception e) {
            log.error("Resend API failed for {}: {}", recipient, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }

    // ── NEW: Synchronous version — used by OtpService ─────────────────────
    // Unlike @Async above, exceptions propagate to the caller so OtpService
    // can catch them, log the OTP code for testing, and not crash the request.
    public void sendHtmlEmailSync(String to, String subject, String htmlBody) {
        String recipient = normalize(to);
        if (!apiKeyPresent(recipient)) {
            throw new RuntimeException("RESEND_API_KEY not configured");
        }
        doSend(recipient, subject, htmlBody, null, null);
        log.info("OTP email sent (sync) to {} — {}", recipient, subject);
    }

    // ── With PDF attachment (WeeklyReportService) ─────────────────────────
    // NOT @Async so exceptions bubble up for fallback handling
    public void sendEmailWithAttachment(String to, String subject,
                                        String htmlBody, byte[] pdfBytes,
                                        String attachmentName) {
        String recipient = normalize(to);
        if (!apiKeyPresent(recipient)) return;
        try {
            doSend(recipient, subject, htmlBody, pdfBytes, attachmentName);
            log.info("Email+PDF sent to {} — {}", recipient, subject);
        } catch (Exception e) {
            log.error("Resend API failed for {}: {}", recipient, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }

    // ── Shared internal send ──────────────────────────────────────────────
    private void doSend(String to, String subject, String htmlBody,
                        byte[] pdfBytes, String attachmentName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("from",    mailFrom);
        payload.put("to",      List.of(to));
        payload.put("subject", subject);
        payload.put("html",    htmlBody);

        if (pdfBytes != null && attachmentName != null) {
            Map<String, String> att = new HashMap<>();
            att.put("filename", attachmentName);
            att.put("content",  Base64.getEncoder().encodeToString(pdfBytes));
            payload.put("attachments", List.of(att));
        }

        ResponseEntity<String> resp = post(payload);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException(
                    "Resend error " + resp.getStatusCode() + ": " + resp.getBody());
        }
    }

    private String normalize(String email) {
        return email == null ? "" : email.toLowerCase().trim();
    }

    private boolean apiKeyPresent(String recipient) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — skipping email to {}", recipient);
            return false;
        }
        return true;
    }

    private ResponseEntity<String> post(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);
        return restTemplate.postForEntity(
                RESEND_URL,
                new HttpEntity<>(payload, headers),
                String.class);
    }
}