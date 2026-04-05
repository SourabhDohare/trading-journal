package com.tradingjournal.controller;

import com.tradingjournal.dto.AnalyticsDTO;
import com.tradingjournal.dto.TradeDTO;
import com.tradingjournal.security.UserPrincipal;
import com.tradingjournal.service.AnalyticsService;
import com.tradingjournal.service.TradeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/trades")
@RequiredArgsConstructor
@Tag(name = "Trades", description = "Trade Journal endpoints")
public class TradeController {

    private final TradeService tradeService;
    private final AnalyticsService analyticsService;

    @PostMapping
    @Operation(summary = "Log a new trade")
    public ResponseEntity<TradeDTO.Response> createTrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TradeDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tradeService.createTrade(principal.getId(), request));
    }

    @GetMapping
    @Operation(summary = "Get paginated trades")
    public ResponseEntity<Page<TradeDTO.Response>> getTrades(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "tradeDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(tradeService.getTrades(principal.getId(), page, size, sortBy, sortDir));
    }

    @GetMapping("/{tradeId}")
    @Operation(summary = "Get a specific trade")
    public ResponseEntity<TradeDTO.Response> getTrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String tradeId) {
        return ResponseEntity.ok(tradeService.getTradeById(principal.getId(), tradeId));
    }

    @PutMapping("/{tradeId}")
    @Operation(summary = "Update trade / add post-trade reflection")
    public ResponseEntity<TradeDTO.Response> updateTrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String tradeId,
            @RequestBody TradeDTO.UpdateRequest request) {
        return ResponseEntity.ok(tradeService.updateTrade(principal.getId(), tradeId, request));
    }

    @DeleteMapping("/{tradeId}")
    @Operation(summary = "Delete a trade")
    public ResponseEntity<Void> deleteTrade(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String tradeId) {
        tradeService.deleteTrade(principal.getId(), tradeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/query")
    @Operation(summary = "Query trades with filters — 'show all FOMO losses', 'trades with RR > 2', etc.")
    public ResponseEntity<List<TradeDTO.Response>> queryTrades(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TradeDTO.QueryRequest query) {
        return ResponseEntity.ok(tradeService.queryTrades(principal.getId(), query));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get performance analytics and pattern insights")
    public ResponseEntity<AnalyticsDTO> getAnalytics(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(analyticsService.getAnalytics(principal.getId(), from, to));
    }
}
