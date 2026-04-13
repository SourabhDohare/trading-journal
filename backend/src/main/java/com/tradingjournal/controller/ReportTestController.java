package com.tradingjournal.controller;

import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * TEST ONLY controller — triggers email immediately without waiting for Monday.
 * Remove this file before going to production, or keep @Profile("!prod") to
 * disable it in production automatically.
 */
@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
// @Profile("!prod")  // ← Uncomment this to disable in prod profile
public class ReportTestController {

    private final WeeklyReportService weeklyReportService;

    /**
     * POST /api/v1/test/send-weekly-report
     * Triggers the weekly report email for the currently logged-in user RIGHT NOW.
     * Use this to verify email delivery and PDF attachment without waiting for Monday.
     */
    @PostMapping("/send-weekly-report")
    public ResponseEntity<Map<String, String>> triggerWeeklyReport(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            weeklyReportService.sendWeeklyReportForCurrentUser(principal.getId());
            return ResponseEntity.ok(Map.of(
                "status", "sent",
                "message", "Weekly report email triggered for " + principal.getEmail()
                         + " — check your inbox (and spam folder)."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }
}