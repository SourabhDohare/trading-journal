package com.tradingjournal.controller;

import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final WeeklyReportService weeklyReportService;

    /**
     * GET /api/v1/reports/download?from=2026-04-01&to=2026-04-13
     * Downloads PDF directly to browser — no email sent.
     */
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        if (from.isAfter(to)) {
            return ResponseEntity.badRequest().build();
        }

        byte[] pdf = weeklyReportService.generateCustomReport(
                principal.getId(), from, to, false); // sendEmail = false

        String filename = "TradePulse_Report_" + from + "_to_" + to + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdf);
    }

    /**
     * POST /api/v1/reports/email
     * Body: { "from": "2026-04-01", "to": "2026-04-13" }
     * Generates PDF and emails it to the user — also returns PDF for download.
     */
    @PostMapping("/email")
    public ResponseEntity<byte[]> emailAndDownloadPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {

        LocalDate from = LocalDate.parse(body.get("from"));
        LocalDate to   = LocalDate.parse(body.get("to"));

        if (from.isAfter(to)) {
            return ResponseEntity.badRequest().build();
        }

        byte[] pdf = weeklyReportService.generateCustomReport(
                principal.getId(), from, to, true); // sendEmail = true

        String filename = "TradePulse_Report_" + from + "_to_" + to + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(pdf);
    }

    /**
     * POST /api/v1/reports/test
     * Triggers Saturday report immediately for current user (last 7 days).
     * Keep this — useful for testing without waiting for Saturday.
     */
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
