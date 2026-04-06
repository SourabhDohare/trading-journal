package com.tradingjournal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsDTO {

    // ─── Summary Stats ────────────────────────────────────────
    private int totalTrades;
    private int winningTrades;
    private int losingTrades;
    private int breakevenTrades;

    private BigDecimal winRate; // %
    private BigDecimal totalPnl;
    private BigDecimal avgProfitPerWin;
    private BigDecimal avgLossPerLoss;
    private BigDecimal profitFactor; // Gross Profit / Gross Loss
    private BigDecimal expectancy; // (WinRate × AvgWin) - (LossRate × AvgLoss)

    private BigDecimal avgRR; // Average R:R
    private BigDecimal avgPlannedRR;
    private BigDecimal avgActualRR;

    private BigDecimal maxDrawdown;
    private BigDecimal maxDrawdownPercent;
    private BigDecimal maxConsecutiveLosses;
    private BigDecimal maxConsecutiveWins;

    private BigDecimal bestTrade;
    private BigDecimal worstTrade;
    private BigDecimal largestWin;
    private BigDecimal largestLoss;

    private BigDecimal avgDisciplineScore;

    // ─── Breakdown by Category ────────────────────────────────
    private Map<String, SetupPerformance> setupPerformance;
    private Map<String, EmotionPerformance> emotionPerformance;
    private Map<String, InstrumentPerformance> instrumentPerformance;
    private Map<String, TimePerformance> timePerformance; // morning/afternoon/etc.
    private Map<String, BigDecimal> monthlyPnl;

    // ─── Pattern Analysis ─────────────────────────────────────
    private List<String> repeatingMistakes;
    private List<String> bestSetups;
    private List<String> worstBehaviors;
    private List<String> recommendations;

    // ─── Behavioral Score ─────────────────────────────────────
    private int disciplineRating; // 1-100
    private String disciplineGrade; // A, B, C, D, F
    private List<String> disciplineBreaks;

    private Map<String, Integer> timeFrameUsage; // "15min" -> 7 (how many trades used it)
    private List<TimeFrameStat> timeFramePerformance; // per-TF win rate & avg P&L

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeFrameStat {
        private String timeFrame;
        private int trades;
        private double winRate;
        private BigDecimal avgPnl;
        private BigDecimal totalPnl;
    }

    @Data
    @Builder
    public static class SetupPerformance {
        private String setupType;
        private int count;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
        private BigDecimal avgRR;
        private BigDecimal totalPnl;
    }

    @Data
    @Builder
    public static class EmotionPerformance {
        private String emotionalState;
        private int count;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
    }

    @Data
    @Builder
    public static class InstrumentPerformance {
        private String instrument;
        private int count;
        private BigDecimal winRate;
        private BigDecimal totalPnl;
        private BigDecimal avgPnl;
    }

    @Data
    @Builder
    public static class TimePerformance {
        private String period; // MORNING (9-11), MID (11-1), AFTERNOON (1-3), CLOSING (3-3:30)
        private int count;
        private BigDecimal winRate;
        private BigDecimal avgPnl;
    }
}
