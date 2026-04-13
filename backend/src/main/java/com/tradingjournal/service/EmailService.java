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

    @Value("${MAIL_FROM:onboarding@resend.dev}")
    private String mailFrom;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RESEND_URL  = "https://api.resend.com/emails";

    // ── HTML only ────────────────────────────────────────────────────────────
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        String recipient = normalize(to);
        if (!apiKeyPresent(recipient)) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from",    mailFrom);
            payload.put("to",      List.of(recipient));
            payload.put("subject", subject);
            payload.put("html",    htmlBody);

            ResponseEntity<String> resp = post(payload);
            if (resp.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent to {} — {}", recipient, subject);
            } else {
                log.error("Resend error {}: {}", resp.getStatusCode(), resp.getBody());
                throw new RuntimeException("Resend error: " + resp.getBody());
            }
        } catch (Exception e) {
            log.error("Resend API failed for {}: {}", recipient, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }

    // ── HTML + PDF attachment ────────────────────────────────────────────────
    // NOTE: @Async removed so exceptions bubble up to WeeklyReportService
    // which falls back to HTML-only if PDF fails
    public void sendEmailWithAttachment(String to, String subject,
                                        String htmlBody, byte[] pdfBytes,
                                        String attachmentName) {
        String recipient = normalize(to);
        if (!apiKeyPresent(recipient)) return;
        try {
            Map<String, String> attachment = new HashMap<>();
            attachment.put("filename", attachmentName);
            attachment.put("content",  Base64.getEncoder().encodeToString(pdfBytes));

            Map<String, Object> payload = new HashMap<>();
            payload.put("from",        mailFrom);
            payload.put("to",          List.of(recipient));
            payload.put("subject",     subject);
            payload.put("html",        htmlBody);
            payload.put("attachments", List.of(attachment));

            ResponseEntity<String> resp = post(payload);
            if (resp.getStatusCode().is2xxSuccessful()) {
                log.info("Email+PDF sent to {} — {}", recipient, subject);
            } else {
                log.error("Resend error {}: {}", resp.getStatusCode(), resp.getBody());
                throw new RuntimeException("Resend error: " + resp.getBody());
            }
        } catch (Exception e) {
            log.error("Resend API failed for {}: {}", recipient, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    // Lowercase + trim — Resend test mode is case-sensitive for recipient match
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