package com.tradingjournal.controller;

import com.tradingjournal.dto.FeedbackDTO;
import com.tradingjournal.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    /**
     * Public endpoint — no authentication required.
     * Handles contact form submissions from /contact page.
     */
    @PostMapping("/contact")
    public ResponseEntity<Map<String, String>> contact(
            @RequestBody FeedbackDTO.ContactRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getMessage() == null || request.getMessage().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and message are required."));
        }

        feedbackService.handleContact(request);
        return ResponseEntity.ok(Map.of("status", "received",
                "message", "Message received. We'll reply within 24 hours."));
    }

    /**
     * Public endpoint — no authentication required.
     * Handles feedback form submissions from /feedback page.
     */
    @PostMapping("/feedback")
    public ResponseEntity<Map<String, String>> feedback(
            @RequestBody FeedbackDTO.FeedbackRequest request) {

        if (request.getCategory() == null || request.getCategory().isBlank()
                || request.getImprovements() == null || request.getImprovements().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Category and improvements are required."));
        }

        feedbackService.handleFeedback(request);
        return ResponseEntity.ok(Map.of("status", "received",
                "message", "Feedback received. Thank you!"));
    }
}