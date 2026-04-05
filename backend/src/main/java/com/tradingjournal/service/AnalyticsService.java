package com.tradingjournal.service;

import com.tradingjournal.dto.AnalyticsDTO;
import com.tradingjournal.model.Trade;
import com.tradingjournal.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final TradeRepository tradeRepository;

    @Cacheable(value = "analytics", key = "#userId + '-' + #dateFrom + '-' + #dateTo")
    public AnalyticsDTO getAnalytics(String userId, LocalDateTime dateFrom, LocalDateTime dateTo) {
        List<Trade> trades;
        if (dateFrom != null && dateTo != null) {
            trades = tradeRepository.findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(userId, dateFrom, dateTo);
        } else {
            trades = tradeRepository.findLastNTrades(userId, PageRequest.of(0, 500));
        }

        List<Trade> closedTrades = trades.stream()
                .filter(t -> t.getOutcomeTag() != null && t.getOutcomeTag() != Trade.OutcomeTag.OPEN)
                .toList();

        return AnalyticsDTO.builder()
                .totalTrades(closedTrades.size())
                .winningTrades((int) countByOutcome(closedTrades, Trade.OutcomeTag.PROFIT))
                .losingTrades((int) countByOutcome(closedTrades, Trade.OutcomeTag.LOSS))
                .breakevenTrades((int) countByOutcome(closedTrades, Trade.OutcomeTag.BREAKEVEN))
                .winRate(calcWinRate(closedTrades))
                .totalPnl(sumPnl(closedTrades))
                .avgProfitPerWin(avgPnlByOutcome(closedTrades, Trade.OutcomeTag.PROFIT))
                .avgLossPerLoss(avgPnlByOutcome(closedTrades, Trade.OutcomeTag.LOSS))
                .profitFactor(calcProfitFactor(closedTrades))
                .expectancy(calcExpectancy(closedTrades))
                .avgActualRR(calcAvgRR(closedTrades))
                .avgPlannedRR(calcAvgPlannedRR(closedTrades))
                .maxDrawdown(calcMaxDrawdown(closedTrades))
                .maxConsecutiveLosses(BigDecimal.valueOf(calcMaxConsecutive(closedTrades, Trade.OutcomeTag.LOSS)))
                .maxConsecutiveWins(BigDecimal.valueOf(calcMaxConsecutive(closedTrades, Trade.OutcomeTag.PROFIT)))
                .bestTrade(maxPnl(closedTrades))
                .worstTrade(minPnl(closedTrades))
                .avgDisciplineScore(calcAvgDisciplineScore(closedTrades))
                .setupPerformance(calcSetupPerformance(closedTrades))
                .emotionPerformance(calcEmotionPerformance(closedTrades))
                .instrumentPerformance(calcInstrumentPerformance(closedTrades))
                .timePerformance(calcTimePerformance(closedTrades))
                .monthlyPnl(calcMonthlyPnl(closedTrades))
                .repeatingMistakes(detectRepeatingMistakes(closedTrades))
                .bestSetups(detectBestSetups(closedTrades))
                .worstBehaviors(detectWorstBehaviors(closedTrades))
                .recommendations(generateRecommendations(closedTrades))
                .disciplineRating(calcDisciplineRating(closedTrades))
                .disciplineGrade(calcDisciplineGrade(closedTrades))
                .disciplineBreaks(detectDisciplineBreaks(closedTrades))
                .build();
    }

    // ─── Core Calculations ────────────────────────────────────

    private BigDecimal calcWinRate(List<Trade> trades) {
        if (trades.isEmpty()) return BigDecimal.ZERO;
        long wins = countByOutcome(trades, Trade.OutcomeTag.PROFIT);
        return BigDecimal.valueOf(wins * 100.0 / trades.size()).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal sumPnl(List<Trade> trades) {
        return trades.stream()
                .filter(t -> t.getPnlAbsolute() != null)
                .map(Trade::getPnlAbsolute)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal avgPnlByOutcome(List<Trade> trades, Trade.OutcomeTag outcome) {
        List<Trade> filtered = trades.stream()
                .filter(t -> t.getOutcomeTag() == outcome && t.getPnlAbsolute() != null)
                .toList();
        if (filtered.isEmpty()) return BigDecimal.ZERO;
        BigDecimal total = filtered.stream().map(Trade::getPnlAbsolute).reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(filtered.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcProfitFactor(List<Trade> trades) {
        BigDecimal grossProfit = trades.stream()
                .filter(t -> t.getOutcomeTag() == Trade.OutcomeTag.PROFIT && t.getPnlAbsolute() != null)
                .map(Trade::getPnlAbsolute)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal grossLoss = trades.stream()
                .filter(t -> t.getOutcomeTag() == Trade.OutcomeTag.LOSS && t.getPnlAbsolute() != null)
                .map(t -> t.getPnlAbsolute().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (grossLoss.compareTo(BigDecimal.ZERO) == 0) return grossProfit.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(999) : BigDecimal.ZERO;
        return grossProfit.divide(grossLoss, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcExpectancy(List<Trade> trades) {
        if (trades.isEmpty()) return BigDecimal.ZERO;
        BigDecimal winRate = calcWinRate(trades).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal lossRate = BigDecimal.ONE.subtract(winRate);
        BigDecimal avgWin = avgPnlByOutcome(trades, Trade.OutcomeTag.PROFIT);
        BigDecimal avgLoss = avgPnlByOutcome(trades, Trade.OutcomeTag.LOSS).abs();
        return winRate.multiply(avgWin).subtract(lossRate.multiply(avgLoss)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcAvgRR(List<Trade> trades) {
        List<BigDecimal> rrs = trades.stream()
                .filter(t -> t.getActualRR() != null)
                .map(Trade::getActualRR)
                .toList();
        if (rrs.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = rrs.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(rrs.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcAvgPlannedRR(List<Trade> trades) {
        List<BigDecimal> rrs = trades.stream()
                .filter(t -> t.getPlannedRR() != null)
                .map(Trade::getPlannedRR)
                .toList();
        if (rrs.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = rrs.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(rrs.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcMaxDrawdown(List<Trade> trades) {
        if (trades.isEmpty()) return BigDecimal.ZERO;
        List<Trade> sorted = trades.stream()
                .filter(t -> t.getPnlAbsolute() != null)
                .sorted(Comparator.comparing(Trade::getTradeDate))
                .toList();

        BigDecimal peak = BigDecimal.ZERO;
        BigDecimal runningPnl = BigDecimal.ZERO;
        BigDecimal maxDD = BigDecimal.ZERO;

        for (Trade t : sorted) {
            runningPnl = runningPnl.add(t.getPnlAbsolute());
            if (runningPnl.compareTo(peak) > 0) peak = runningPnl;
            BigDecimal dd = peak.subtract(runningPnl);
            if (dd.compareTo(maxDD) > 0) maxDD = dd;
        }
        return maxDD;
    }

    private int calcMaxConsecutive(List<Trade> trades, Trade.OutcomeTag outcome) {
        int max = 0, current = 0;
        for (Trade t : trades) {
            if (t.getOutcomeTag() == outcome) { current++; max = Math.max(max, current); }
            else current = 0;
        }
        return max;
    }

    private BigDecimal maxPnl(List<Trade> trades) {
        return trades.stream().filter(t -> t.getPnlAbsolute() != null)
                .map(Trade::getPnlAbsolute).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
    }

    private BigDecimal minPnl(List<Trade> trades) {
        return trades.stream().filter(t -> t.getPnlAbsolute() != null)
                .map(Trade::getPnlAbsolute).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
    }

    private BigDecimal calcAvgDisciplineScore(List<Trade> trades) {
        List<Integer> scores = trades.stream()
                .filter(t -> t.getDisciplineScore() != null).map(Trade::getDisciplineScore).toList();
        if (scores.isEmpty()) return BigDecimal.ZERO;
        return BigDecimal.valueOf(scores.stream().mapToInt(i -> i).average().orElse(0))
                .setScale(1, RoundingMode.HALF_UP);
    }

    // ─── Breakdown Analytics ──────────────────────────────────

    private Map<String, AnalyticsDTO.SetupPerformance> calcSetupPerformance(List<Trade> trades) {
        Map<Trade.SetupType, List<Trade>> grouped = trades.stream()
                .filter(t -> t.getSetupType() != null)
                .collect(Collectors.groupingBy(Trade::getSetupType));

        Map<String, AnalyticsDTO.SetupPerformance> result = new LinkedHashMap<>();
        grouped.forEach((setup, ts) -> result.put(setup.name(), AnalyticsDTO.SetupPerformance.builder()
                .setupType(setup.name())
                .count(ts.size())
                .winRate(calcWinRate(ts))
                .avgPnl(avgPnlByOutcome(ts, Trade.OutcomeTag.PROFIT))
                .avgRR(calcAvgRR(ts))
                .totalPnl(sumPnl(ts))
                .build()));
        return result;
    }

    private Map<String, AnalyticsDTO.EmotionPerformance> calcEmotionPerformance(List<Trade> trades) {
        Map<Trade.EmotionalState, List<Trade>> grouped = trades.stream()
                .filter(t -> t.getEmotionalState() != null)
                .collect(Collectors.groupingBy(Trade::getEmotionalState));

        Map<String, AnalyticsDTO.EmotionPerformance> result = new LinkedHashMap<>();
        grouped.forEach((emotion, ts) -> result.put(emotion.name(), AnalyticsDTO.EmotionPerformance.builder()
                .emotionalState(emotion.name())
                .count(ts.size())
                .winRate(calcWinRate(ts))
                .avgPnl(sumPnl(ts).divide(BigDecimal.valueOf(ts.size()), 2, RoundingMode.HALF_UP))
                .build()));
        return result;
    }

    private Map<String, AnalyticsDTO.InstrumentPerformance> calcInstrumentPerformance(List<Trade> trades) {
        Map<String, List<Trade>> grouped = trades.stream()
                .filter(t -> t.getInstrument() != null)
                .collect(Collectors.groupingBy(Trade::getInstrument));

        Map<String, AnalyticsDTO.InstrumentPerformance> result = new LinkedHashMap<>();
        grouped.forEach((inst, ts) -> result.put(inst, AnalyticsDTO.InstrumentPerformance.builder()
                .instrument(inst).count(ts.size()).winRate(calcWinRate(ts))
                .totalPnl(sumPnl(ts))
                .avgPnl(sumPnl(ts).divide(BigDecimal.valueOf(ts.size()), 2, RoundingMode.HALF_UP))
                .build()));
        return result;
    }

    private Map<String, AnalyticsDTO.TimePerformance> calcTimePerformance(List<Trade> trades) {
        Map<String, List<Trade>> grouped = new LinkedHashMap<>();
        grouped.put("MORNING_9_11", new ArrayList<>());
        grouped.put("MID_11_1", new ArrayList<>());
        grouped.put("AFTERNOON_1_3", new ArrayList<>());
        grouped.put("CLOSING_3_330", new ArrayList<>());

        for (Trade t : trades) {
            if (t.getTradeDate() == null) continue;
            int hour = t.getTradeDate().getHour();
            int minute = t.getTradeDate().getMinute();
            if (hour >= 9 && hour < 11) grouped.get("MORNING_9_11").add(t);
            else if (hour >= 11 && hour < 13) grouped.get("MID_11_1").add(t);
            else if (hour >= 13 && hour < 15) grouped.get("AFTERNOON_1_3").add(t);
            else if (hour == 15 && minute <= 30) grouped.get("CLOSING_3_330").add(t);
        }

        Map<String, AnalyticsDTO.TimePerformance> result = new LinkedHashMap<>();
        grouped.forEach((period, ts) -> {
            if (!ts.isEmpty()) result.put(period, AnalyticsDTO.TimePerformance.builder()
                    .period(period).count(ts.size()).winRate(calcWinRate(ts))
                    .avgPnl(sumPnl(ts).divide(BigDecimal.valueOf(ts.size()), 2, RoundingMode.HALF_UP))
                    .build());
        });
        return result;
    }

    private Map<String, BigDecimal> calcMonthlyPnl(List<Trade> trades) {
        return trades.stream()
                .filter(t -> t.getPnlAbsolute() != null && t.getTradeDate() != null)
                .collect(Collectors.groupingBy(
                        t -> t.getTradeDate().getYear() + "-" + String.format("%02d", t.getTradeDate().getMonthValue()),
                        TreeMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Trade::getPnlAbsolute, BigDecimal::add)));
    }

    // ─── Pattern Detection ────────────────────────────────────

    private List<String> detectRepeatingMistakes(List<Trade> trades) {
        List<String> mistakes = new ArrayList<>();

        long fomoLosses = trades.stream()
                .filter(t -> t.getEmotionalState() == Trade.EmotionalState.FOMO && t.getOutcomeTag() == Trade.OutcomeTag.LOSS)
                .count();
        if (fomoLosses >= 3) mistakes.add("FOMO trades lead to losses (" + fomoLosses + " instances) — stop chasing");

        long slBreaches = trades.stream().filter(t -> !t.isSlRespected()).count();
        if (slBreaches >= 2) mistakes.add("SL not respected in " + slBreaches + " trades — this is a capital destruction pattern");

        long revengeTrades = trades.stream()
                .filter(t -> t.getEmotionalState() == Trade.EmotionalState.REVENGE).count();
        if (revengeTrades >= 2) mistakes.add("Revenge trading detected (" + revengeTrades + " trades) — take a break after losses");

        long earlyExits = trades.stream()
                .filter(t -> t.getTags() != null && t.getTags().contains("#EarlyExit")).count();
        if (earlyExits >= 3) mistakes.add("Early exits in " + earlyExits + " trades — you're leaving money on the table");

        return mistakes;
    }

    private List<String> detectBestSetups(List<Trade> trades) {
        return trades.stream()
                .filter(t -> t.getSetupType() != null)
                .collect(Collectors.groupingBy(Trade::getSetupType))
                .entrySet().stream()
                .filter(e -> {
                    List<Trade> ts = e.getValue();
                    BigDecimal wr = calcWinRate(ts);
                    return ts.size() >= 3 && wr.compareTo(BigDecimal.valueOf(60)) >= 0;
                })
                .sorted((a, b) -> calcWinRate(b.getValue()).compareTo(calcWinRate(a.getValue())))
                .map(e -> e.getKey().name() + " (" + Math.round(calcWinRate(e.getValue()).doubleValue()) + "% win rate, " + e.getValue().size() + " trades)")
                .limit(3)
                .collect(Collectors.toList());
    }

    private List<String> detectWorstBehaviors(List<Trade> trades) {
        List<String> behaviors = new ArrayList<>();
        Map<Trade.EmotionalState, List<Trade>> byEmotion = trades.stream()
                .filter(t -> t.getEmotionalState() != null && t.getOutcomeTag() == Trade.OutcomeTag.LOSS)
                .collect(Collectors.groupingBy(Trade::getEmotionalState));

        byEmotion.entrySet().stream()
                .filter(e -> e.getValue().size() >= 2)
                .forEach(e -> behaviors.add("Trading while " + e.getKey().name() + " caused " + e.getValue().size() + " losses"));

        return behaviors;
    }

    private List<String> generateRecommendations(List<Trade> trades) {
        List<String> recs = new ArrayList<>();

        BigDecimal winRate = calcWinRate(trades);
        if (winRate.compareTo(BigDecimal.valueOf(40)) < 0) {
            recs.add("Win rate below 40% — focus on setup quality over quantity, take only A-grade setups");
        }
        if (calcAvgRR(trades).compareTo(BigDecimal.valueOf(1)) < 0) {
            recs.add("Average R:R below 1:1 — you're risking more than you make. Revisit your targets or cut losses earlier");
        }
        long slBreaches = trades.stream().filter(t -> !t.isSlRespected()).count();
        if (slBreaches > 0) {
            recs.add("Stop moving your SL. It is not negotiable once set. Use alerts and hard stops.");
        }
        return recs;
    }

    private int calcDisciplineRating(List<Trade> trades) {
        if (trades.isEmpty()) return 0;
        int score = 100;
        long slBreaches = trades.stream().filter(t -> !t.isSlRespected()).count();
        score -= (int) (slBreaches * 10);
        long fomo = trades.stream().filter(t -> t.getEmotionalState() == Trade.EmotionalState.FOMO).count();
        score -= (int) (fomo * 5);
        return Math.max(0, Math.min(100, score));
    }

    private String calcDisciplineGrade(List<Trade> trades) {
        int rating = calcDisciplineRating(trades);
        if (rating >= 90) return "A";
        if (rating >= 75) return "B";
        if (rating >= 60) return "C";
        if (rating >= 40) return "D";
        return "F";
    }

    private List<String> detectDisciplineBreaks(List<Trade> trades) {
        return trades.stream()
                .filter(t -> t.getTags() != null && t.getTags().contains("#DisciplineBreak"))
                .map(t -> t.getTradeId() + " — " + t.getInstrument() + " on " + t.getTradeDate())
                .toList();
    }

    private long countByOutcome(List<Trade> trades, Trade.OutcomeTag outcome) {
        return trades.stream().filter(t -> t.getOutcomeTag() == outcome).count();
    }
}
