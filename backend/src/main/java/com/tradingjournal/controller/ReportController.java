package com.tradingjournal.controller;

import com.tradingjournal.dto.AnalyticsDTO;
import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.AnalyticsService;
import com.tradingjournal.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Map;

/**
 * Single unified controller for /reports — combines:
 *  - existing analytics summary endpoints (daily/weekly/monthly/yearly)
 *  - new custom PDF download + email endpoints
 *  - test trigger endpoint
 *
 * DELETE any other ReportController.java file — only this one should exist.
 */
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AnalyticsService    analyticsService;
    private final WeeklyReportService weeklyReportService;

    // ── EXISTING: analytics summary for each period ───────────────────────────

    @GetMapping("/daily")
    public ResponseEntity<AnalyticsDTO> getDaily(
            @AuthenticationPrincipal UserPrincipal principal) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end   = LocalDate.now().atTime(23, 59, 59);
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), start, end));
    }

    @GetMapping("/weekly")
    public ResponseEntity<AnalyticsDTO> getWeekly(
            @AuthenticationPrincipal UserPrincipal principal) {
        LocalDate today = LocalDate.now();
        // Monday of current week → today
        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
        return ResponseEntity.ok(analyticsService.getAnalytics(
                principal.getId(), monday.atStartOfDay(), today.atTime(23, 59, 59)));
    }

    @GetMapping("/monthly")
    public ResponseEntity<AnalyticsDTO> getMonthly(
            @AuthenticationPrincipal UserPrincipal principal) {
        LocalDate today      = LocalDate.now();
        LocalDate firstOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
        return ResponseEntity.ok(analyticsService.getAnalytics(
                principal.getId(), firstOfMonth.atStartOfDay(), today.atTime(23, 59, 59)));
    }

    @GetMapping("/yearly")
    public ResponseEntity<AnalyticsDTO> getYearly(
            @AuthenticationPrincipal UserPrincipal principal) {
        LocalDate today       = LocalDate.now();
        LocalDate firstOfYear = today.with(TemporalAdjusters.firstDayOfYear());
        return ResponseEntity.ok(analyticsService.getAnalytics(
                principal.getId(), firstOfYear.atStartOfDay(), today.atTime(23, 59, 59)));
    }

    // ── NEW: download PDF for any custom date range ───────────────────────────

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        if (from.isAfter(to)) return ResponseEntity.badRequest().build();

        byte[] pdf = weeklyReportService.generateCustomReport(
                principal.getId(), from, to, false);

        String filename = "TradePulse_Report_" + from + "_to_" + to + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ── NEW: email + download PDF ─────────────────────────────────────────────

    @PostMapping("/email")
    public ResponseEntity<byte[]> emailAndDownload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {

        LocalDate from = LocalDate.parse(body.get("from"));
        LocalDate to   = LocalDate.parse(body.get("to"));

        if (from.isAfter(to)) return ResponseEntity.badRequest().build();

        byte[] pdf = weeklyReportService.generateCustomReport(
                principal.getId(), from, to, true);

        String filename = "TradePulse_Report_" + from + "_to_" + to + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // ── TEST: trigger Saturday report immediately ─────────────────────────────

    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> triggerTest(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            weeklyReportService.sendWeeklyReportForCurrentUser(principal.getId());
            return ResponseEntity.ok(Map.of(
                "status",  "sent",
                "message", "Report triggered for " + principal.getEmail() + " — check inbox."
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status",  "error",
                "message", e.getMessage()
            ));
        }
    }
}