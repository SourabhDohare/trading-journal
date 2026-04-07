package com.tradingjournal.controller;

import com.tradingjournal.dto.DailySessionDTO;
import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.DailySessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@Tag(name = "Daily Sessions", description = "Journal entries saved per trading day")
public class DailySessionController {

    private final DailySessionService service;

    // ── POST /sessions — save or update today's journal ──────────────────────
    @PostMapping
    @Operation(summary = "Save or update today's journal entry (upsert)")
    public ResponseEntity<DailySessionDTO.Response> save(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody DailySessionDTO.SaveRequest request) {
        return ResponseEntity.ok(service.saveSession(principal.getId(), request));
    }

    // ── GET /sessions/today — get today's entry ───────────────────────────────
    @GetMapping("/today")
    @Operation(summary = "Get today's journal entry")
    public ResponseEntity<DailySessionDTO.Response> getToday(
            @AuthenticationPrincipal UserPrincipal principal) {
        DailySessionDTO.Response r = service.getTodaySession(principal.getId());
        return r != null ? ResponseEntity.ok(r) : ResponseEntity.noContent().build();
    }

    // ── GET /sessions — get all sessions (history) ────────────────────────────
    @GetMapping
    @Operation(summary = "Get all past journal entries, newest first")
    public ResponseEntity<List<DailySessionDTO.Response>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(service.getRecentSessions(principal.getId(), limit));
    }

    // ── GET /sessions/{date} — get a specific day ─────────────────────────────
    @GetMapping("/{date}")
    @Operation(summary = "Get journal entry for a specific date (yyyy-MM-dd)")
    public ResponseEntity<DailySessionDTO.Response> getByDate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String date) {
        DailySessionDTO.Response r = service.getSessionByDate(
                principal.getId(), LocalDate.parse(date));
        return r != null ? ResponseEntity.ok(r) : ResponseEntity.noContent().build();
    }
}
