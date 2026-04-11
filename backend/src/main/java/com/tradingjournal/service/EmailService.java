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

/**
 * EmailService using Resend API (https://resend.com)
 *
 * WHY Resend instead of SMTP:
 * Render free tier BLOCKS outbound SMTP ports 25, 587, 465.
 * Resend uses HTTPS (port 443) which is always open.
 *
 * Setup (free tier = 100 emails/day, 3000/month):
 * 1. Sign up at resend.com
 * 2. Verify your domain OR use onboarding@resend.dev for testing
 * 3. Create API key at resend.com/api-keys
 * 4. Add to Render env vars:
 *    RESEND_API_KEY = re_xxxxxxxxxxxx
 *    MAIL_FROM      = TradePulse <noreply@yourdomain.com>
 *                     (or for testing: onboarding@resend.dev)
 */
@Service
@Slf4j
public class EmailService {

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    @Value("${MAIL_FROM:TradePulse <noreply@tradepulse.app>}")
    private String mailFrom;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RESEND_URL  = "https://api.resend.com/emails";

    // ── Send plain HTML email ────────────────────────────────────────────────
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — skipping email to {}", to);
            return;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from",    mailFrom);
            payload.put("to",      List.of(to));
            payload.put("subject", subject);
            payload.put("html",    htmlBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> resp = restTemplate.postForEntity(RESEND_URL, request, String.class);

            if (resp.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent via Resend to {} — subject: {}", to, subject);
            } else {
                log.error("Resend API error {}: {}", resp.getStatusCode(), resp.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ── Send HTML email with PDF attachment (Base64 encoded) ────────────────
    @Async
    public void sendEmailWithAttachment(String to, String subject,
                                        String htmlBody, byte[] pdfBytes,
                                        String attachmentName) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — skipping email with attachment to {}", to);
            return;
        }
        try {
            // Resend supports attachments as Base64
            Map<String, String> attachment = new HashMap<>();
            attachment.put("filename", attachmentName);
            attachment.put("content",  Base64.getEncoder().encodeToString(pdfBytes));

            Map<String, Object> payload = new HashMap<>();
            payload.put("from",        mailFrom);
            payload.put("to",          List.of(to));
            payload.put("subject",     subject);
            payload.put("html",        htmlBody);
            payload.put("attachments", List.of(attachment));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> resp = restTemplate.postForEntity(RESEND_URL, request, String.class);

            if (resp.getStatusCode().is2xxSuccessful()) {
                log.info("Email+PDF sent via Resend to {} — subject: {}", to, subject);
            } else {
                log.error("Resend API error {}: {}", resp.getStatusCode(), resp.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage());
        }
    }
}