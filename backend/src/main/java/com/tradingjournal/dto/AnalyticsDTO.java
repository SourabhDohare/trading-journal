package com.tradingjournal.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDTO {

    // ─── Summary stats ────────────────────────────────────────
    private int totalTrades;
    private int winningTrades;
    private int losingTrades;
    private int breakevenTrades;
    private BigDecimal winRate;
    private BigDecimal totalPnl;
    private BigDecimal avgProfitPerWin;
    private BigDecimal avgLossPerLoss;
    private BigDecimal profitFactor;
    private BigDecimal expectancy;
    private BigDecimal avgActualRR;
    private BigDecimal avgPlannedRR;
    private BigDecimal maxDrawdown;
    private BigDecimal maxConsecutiveLosses;
    private BigDecimal maxConsecutiveWins;
    private BigDecimal bestTrade;
    private BigDecimal worstTrade;
    private BigDecimal avgDisciplineScore;

    // ─── Breakdown maps (keyed by name) ──────────────────────
    // Frontend accesses as: analytics.setupPerformance["BREAKOUT"].count
    private Map<String, SetupPerformance>      setupPerformance;
    private Map<String, EmotionPerformance>    emotionPerformance;
    private Map<String, InstrumentPerformance> instrumentPerformance;
    private Map<String, TimePerformance>       timePerformance;
    private Map<String, BigDecimal>            monthlyPnl;

    // ─── Time Frame fields (NEW) ──────────────────────────────
    private Map<String, Integer>       timeFrameUsage;       // "15min" -> 5
    private List<TimeFramePerformance> timeFramePerformance; // sorted array

    // ─── Pattern / AI ─────────────────────────────────────────
    private List<String> repeatingMistakes;
    private List<String> bestSetups;
    private List<String> worstBehaviors;
    private List<String> recommendations;
    private List<String> disciplineBreaks;

    // ─── Discipline ───────────────────────────────────────────
    private int    disciplineRating;
    private String disciplineGrade;

    // ══════════════════════════════════════════════════════════
    //  Inner stat classes — serialised as JSON objects
    // ══════════════════════════════════════════════════════════

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SetupPerformance {
        private int        count;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
        private BigDecimal totalPnl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmotionPerformance {
        private int        count;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstrumentPerformance {
        private int        count;
        private BigDecimal winRate;
        private BigDecimal totalPnl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimePerformance {
        private int        count;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeFramePerformance {
        private String     timeFrame;
        private int        trades;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
        private BigDecimal totalPnl;
    }
}
