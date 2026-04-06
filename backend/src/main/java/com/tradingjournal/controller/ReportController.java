package com.tradingjournal.controller;

import com.tradingjournal.dto.AnalyticsDTO;
import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Daily, weekly, monthly, yearly performance reports")
public class ReportController {

    private final AnalyticsService analyticsService;

    @GetMapping("/daily")
    @Operation(summary = "Today's trading report")
    public ResponseEntity<AnalyticsDTO> dailyReport(@AuthenticationPrincipal UserPrincipal principal) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end   = LocalDate.now().atTime(23, 59, 59);
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), start, end));
    }

    @GetMapping("/weekly")
    @Operation(summary = "This week's trading report (Mon–Sun)")
    public ResponseEntity<AnalyticsDTO> weeklyReport(@AuthenticationPrincipal UserPrincipal principal) {
        LocalDateTime start = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay();
        LocalDateTime end = LocalDateTime.now();
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), start, end));
    }

    @GetMapping("/monthly")
    @Operation(summary = "This month's trading report")
    public ResponseEntity<AnalyticsDTO> monthlyReport(@AuthenticationPrincipal UserPrincipal principal) {
        LocalDateTime start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime end   = LocalDateTime.now();
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), start, end));
    }

    @GetMapping("/yearly")
    @Operation(summary = "This year's trading report")
    public ResponseEntity<AnalyticsDTO> yearlyReport(@AuthenticationPrincipal UserPrincipal principal) {
        LocalDateTime start = LocalDate.now().withDayOfYear(1).atStartOfDay();
        LocalDateTime end   = LocalDateTime.now();
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), start, end));
    }

    @GetMapping("/custom")
    @Operation(summary = "Custom date range report")
    public ResponseEntity<AnalyticsDTO> customReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String from,
            @RequestParam String to) {
        LocalDateTime start = LocalDate.parse(from).atStartOfDay();
        LocalDateTime end   = LocalDate.parse(to).atTime(23, 59, 59);
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), start, end));
    }
}
