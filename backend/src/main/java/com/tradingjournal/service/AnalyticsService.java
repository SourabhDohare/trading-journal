package com.tradingjournal.service;

import com.tradingjournal.dto.AnalyticsDTO;
import com.tradingjournal.model.Trade;
import com.tradingjournal.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TradeRepository tradeRepository;

    // ══════════════════════════════════════════════════════════
    //  PUBLIC API
    // ══════════════════════════════════════════════════════════

    public AnalyticsDTO getAnalytics(String userId, LocalDateTime dateFrom, LocalDateTime dateTo) {
        List<Trade> trades;

        if (dateFrom != null && dateTo != null) {
            trades = tradeRepository.findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(
                    userId, dateFrom, dateTo);
        } else {
            trades = tradeRepository.findByUserIdOrderByTradeDateDesc(
                    userId, PageRequest.of(0, 10000)).getContent();
        }

        // SIMPLE RULE: include every trade that is CLOSED (not OPEN, not NO_TRADE)
        // No pnlAbsolute check — that was causing trades to be silently excluded
        List<Trade> analyticsBase = trades.stream()
                .filter(t -> t.getOutcomeTag() != null)
                .filter(t -> t.getOutcomeTag() != Trade.OutcomeTag.OPEN)
                .filter(t -> t.getOutcomeTag() != Trade.OutcomeTag.NO_TRADE)
                .collect(Collectors.toList());

        return buildAnalyticsDTO(analyticsBase);
    }

    // ══════════════════════════════════════════════════════════
    //  DTO BUILDER
    // ══════════════════════════════════════════════════════════

    private AnalyticsDTO buildAnalyticsDTO(List<Trade> trades) {
        return AnalyticsDTO.builder()
                .totalTrades(trades.size())
                .winningTrades((int) countByOutcome(trades, Trade.OutcomeTag.PROFIT))
                .losingTrades((int) countByOutcome(trades, Trade.OutcomeTag.LOSS))
                .breakevenTrades((int) countByOutcome(trades, Trade.OutcomeTag.BREAKEVEN))
                .winRate(calcWinRate(trades))
                .totalPnl(sumPnl(trades))
                .avgProfitPerWin(avgPnlByOutcome(trades, Trade.OutcomeTag.PROFIT))
                .avgLossPerLoss(avgPnlByOutcome(trades, Trade.OutcomeTag.LOSS))
                .profitFactor(calcProfitFactor(trades))
                .expectancy(calcExpectancy(trades))
                .avgActualRR(calcAvgRR(trades))
                .avgPlannedRR(calcAvgPlannedRR(trades))
                .maxDrawdown(calcMaxDrawdown(trades))
                .maxConsecutiveLosses(BigDecimal.valueOf(calcMaxConsecutive(trades, Trade.OutcomeTag.LOSS)))
                .maxConsecutiveWins(BigDecimal.valueOf(calcMaxConsecutive(trades, Trade.OutcomeTag.PROFIT)))
                .bestTrade(maxPnl(trades))
                .worstTrade(minPnl(trades))
                .avgDisciplineScore(calcAvgDisciplineScore(trades))
                .setupPerformance(calcSetupPerformance(trades))
                .emotionPerformance(calcEmotionPerformance(trades))
                .instrumentPerformance(calcInstrumentPerformance(trades))
                .timePerformance(calcTimePerformance(trades))
                .monthlyPnl(calcMonthlyPnl(trades))
                .timeFrameUsage(calcTimeFrameUsage(trades))
                .timeFramePerformance(calcTimeFramePerformance(trades))
                .repeatingMistakes(detectRepeatingMistakes(trades))
                .bestSetups(detectBestSetups(trades))
                .worstBehaviors(detectWorstBehaviors(trades))
                .recommendations(generateRecommendations(trades))
                .disciplineRating(calcDisciplineRating(trades))
                .disciplineGrade(calcDisciplineGrade(trades))
                .disciplineBreaks(detectDisciplineBreaks(trades))
                .build();
    }

    // ══════════════════════════════════════════════════════════
    //  CORE CALCULATIONS — all null-safe
    // ══════════════════════════════════════════════════════════

    private long countByOutcome(List<Trade> trades, Trade.OutcomeTag tag) {
        return trades.stream().filter(t -> t.getOutcomeTag() == tag).count();
    }

    private BigDecimal sumPnl(List<Trade> trades) {
        return trades.stream()
                .map(Trade::getPnlAbsolute)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcWinRate(List<Trade> trades) {
        long decided = trades.stream()
                .filter(t -> t.getOutcomeTag() == Trade.OutcomeTag.PROFIT
                          || t.getOutcomeTag() == Trade.OutcomeTag.LOSS
                          || t.getOutcomeTag() == Trade.OutcomeTag.BREAKEVEN)
                .count();
        if (decided == 0) return BigDecimal.ZERO;
        long wins = countByOutcome(trades, Trade.OutcomeTag.PROFIT);
        return BigDecimal.valueOf(wins * 100.0 / decided)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcProfitFactor(List<Trade> trades) {
        BigDecimal grossProfit = trades.stream()
                .map(Trade::getPnlAbsolute)
                .filter(Objects::nonNull)
                .filter(p -> p.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal grossLoss = trades.stream()
                .map(Trade::getPnlAbsolute)
                .filter(Objects::nonNull)
                .filter(p -> p.compareTo(BigDecimal.ZERO) < 0)
                .map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (grossLoss.compareTo(BigDecimal.ZERO) == 0) {
            return grossProfit.compareTo(BigDecimal.ZERO) > 0
                    ? BigDecimal.valueOf(999.99) : BigDecimal.ZERO;
        }
        return grossProfit.divide(grossLoss, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcExpectancy(List<Trade> trades) {
        if (trades.isEmpty()) return BigDecimal.ZERO;
        return sumPnl(trades).divide(BigDecimal.valueOf(trades.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal avgPnlByOutcome(List<Trade> trades, Trade.OutcomeTag tag) {
        List<BigDecimal> pnls = trades.stream()
                .filter(t -> t.getOutcomeTag() == tag)
                .map(Trade::getPnlAbsolute)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (pnls.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = pnls.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(pnls.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcAvgRR(List<Trade> trades) {
        List<BigDecimal> rrs = trades.stream()
                .map(Trade::getActualRR)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (rrs.isEmpty()) return BigDecimal.ZERO;
        return rrs.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(rrs.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcAvgPlannedRR(List<Trade> trades) {
        List<BigDecimal> rrs = trades.stream()
                .map(Trade::getPlannedRR)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (rrs.isEmpty()) return BigDecimal.ZERO;
        return rrs.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(rrs.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcMaxDrawdown(List<Trade> trades) {
        BigDecimal peak = BigDecimal.ZERO;
        BigDecimal equity = BigDecimal.ZERO;
        BigDecimal maxDD = BigDecimal.ZERO;
        for (Trade t : trades) {
            if (t.getPnlAbsolute() == null) continue;
            equity = equity.add(t.getPnlAbsolute());
            if (equity.compareTo(peak) > 0) peak = equity;
            BigDecimal dd = peak.subtract(equity);
            if (dd.compareTo(maxDD) > 0) maxDD = dd;
        }
        return maxDD;
    }

    private BigDecimal maxPnl(List<Trade> trades) {
        return trades.stream()
                .map(Trade::getPnlAbsolute)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal minPnl(List<Trade> trades) {
        return trades.stream()
                .map(Trade::getPnlAbsolute)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
    }

    private int calcMaxConsecutive(List<Trade> trades, Trade.OutcomeTag tag) {
        int max = 0, current = 0;
        for (Trade t : trades) {
            if (t.getOutcomeTag() == tag) {
                current++;
                max = Math.max(max, current);
            } else {
                current = 0;
            }
        }
        return max;
    }

    private BigDecimal calcAvgDisciplineScore(List<Trade> trades) {
        List<Integer> scores = trades.stream()
                .map(Trade::getDisciplineScore)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (scores.isEmpty()) return BigDecimal.ZERO;
        return BigDecimal.valueOf(scores.stream().mapToInt(i -> i).average().orElse(0))
                .setScale(1, RoundingMode.HALF_UP);
    }

    // ══════════════════════════════════════════════════════════
    //  BREAKDOWN MAPS — properly typed to match AnalyticsDTO
    // ══════════════════════════════════════════════════════════

    private Map<String, AnalyticsDTO.SetupPerformance> calcSetupPerformance(List<Trade> trades) {
        Map<String, List<Trade>> grouped = new LinkedHashMap<>();
        for (Trade t : trades) {
            if (t.getSetupType() == null) continue;
            grouped.computeIfAbsent(t.getSetupType().name(), k -> new ArrayList<>()).add(t);
        }
        Map<String, AnalyticsDTO.SetupPerformance> result = new LinkedHashMap<>();
        grouped.forEach((key, list) -> {
            long wins = countByOutcome(list, Trade.OutcomeTag.PROFIT);
            BigDecimal wr = list.isEmpty() ? BigDecimal.ZERO
                    : BigDecimal.valueOf(wins * 100.0 / list.size()).setScale(1, RoundingMode.HALF_UP);
            BigDecimal total = sumPnl(list);
            BigDecimal avg = list.isEmpty() ? BigDecimal.ZERO
                    : total.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP);
            result.put(key, AnalyticsDTO.SetupPerformance.builder()
                    .count(list.size()).winRate(wr).avgPnl(avg).totalPnl(total).build());
        });
        return result;
    }

    private Map<String, AnalyticsDTO.EmotionPerformance> calcEmotionPerformance(List<Trade> trades) {
        Map<String, List<Trade>> grouped = new LinkedHashMap<>();
        for (Trade t : trades) {
            if (t.getEmotionalState() == null) continue;
            grouped.computeIfAbsent(t.getEmotionalState().name(), k -> new ArrayList<>()).add(t);
        }
        Map<String, AnalyticsDTO.EmotionPerformance> result = new LinkedHashMap<>();
        grouped.forEach((key, list) -> {
            long wins = countByOutcome(list, Trade.OutcomeTag.PROFIT);
            BigDecimal wr = list.isEmpty() ? BigDecimal.ZERO
                    : BigDecimal.valueOf(wins * 100.0 / list.size()).setScale(1, RoundingMode.HALF_UP);
            BigDecimal total = sumPnl(list);
            BigDecimal avg = list.isEmpty() ? BigDecimal.ZERO
                    : total.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP);
            result.put(key, AnalyticsDTO.EmotionPerformance.builder()
                    .count(list.size()).winRate(wr).avgPnl(avg).build());
        });
        return result;
    }

    private Map<String, AnalyticsDTO.InstrumentPerformance> calcInstrumentPerformance(List<Trade> trades) {
        Map<String, List<Trade>> grouped = new LinkedHashMap<>();
        for (Trade t : trades) {
            if (t.getInstrument() == null) continue;
            grouped.computeIfAbsent(t.getInstrument(), k -> new ArrayList<>()).add(t);
        }
        Map<String, AnalyticsDTO.InstrumentPerformance> result = new LinkedHashMap<>();
        grouped.forEach((key, list) -> {
            long wins = countByOutcome(list, Trade.OutcomeTag.PROFIT);
            BigDecimal wr = list.isEmpty() ? BigDecimal.ZERO
                    : BigDecimal.valueOf(wins * 100.0 / list.size()).setScale(1, RoundingMode.HALF_UP);
            BigDecimal total = sumPnl(list);
            result.put(key, AnalyticsDTO.InstrumentPerformance.builder()
                    .count(list.size()).winRate(wr).totalPnl(total).build());
        });
        return result;
    }

    private Map<String, AnalyticsDTO.TimePerformance> calcTimePerformance(List<Trade> trades) {
        Map<String, List<Trade>> grouped = new LinkedHashMap<>();
        for (Trade t : trades) {
            if (t.getTradeDate() == null) continue;
            int hour = t.getTradeDate().getHour();
            String period;
            if      (hour >= 9  && hour < 11) period = "MORNING_9_11";
            else if (hour >= 11 && hour < 13) period = "MID_11_1";
            else if (hour >= 13 && hour < 15) period = "AFTERNOON_1_3";
            else if (hour >= 15 && hour < 16) period = "CLOSING_3_330";
            else continue;
            grouped.computeIfAbsent(period, k -> new ArrayList<>()).add(t);
        }
        Map<String, AnalyticsDTO.TimePerformance> result = new LinkedHashMap<>();
        grouped.forEach((key, list) -> {
            long wins = countByOutcome(list, Trade.OutcomeTag.PROFIT);
            BigDecimal wr = list.isEmpty() ? BigDecimal.ZERO
                    : BigDecimal.valueOf(wins * 100.0 / list.size()).setScale(1, RoundingMode.HALF_UP);
            BigDecimal total = sumPnl(list);
            BigDecimal avg = list.isEmpty() ? BigDecimal.ZERO
                    : total.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP);
            result.put(key, AnalyticsDTO.TimePerformance.builder()
                    .count(list.size()).winRate(wr).avgPnl(avg).build());
        });
        return result;
    }

    private Map<String, BigDecimal> calcMonthlyPnl(List<Trade> trades) {
        Map<String, BigDecimal> monthly = new TreeMap<>();
        for (Trade t : trades) {
            if (t.getTradeDate() == null || t.getPnlAbsolute() == null) continue;
            String month = t.getTradeDate().getYear() + "-"
                    + String.format("%02d", t.getTradeDate().getMonthValue());
            monthly.merge(month, t.getPnlAbsolute(), BigDecimal::add);
        }
        return monthly;
    }

    // ══════════════════════════════════════════════════════════
    //  TIME FRAME ANALYTICS (NEW)
    // ══════════════════════════════════════════════════════════

    private Map<String, Integer> calcTimeFrameUsage(List<Trade> trades) {
        Map<String, Integer> usage = new LinkedHashMap<>();
        for (Trade t : trades) {
            if (t.getTimeFrames() == null) continue;
            for (String tf : t.getTimeFrames()) {
                usage.merge(tf, 1, Integer::sum);
            }
        }
        // Sort by count descending
        return usage.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
    }

    private List<AnalyticsDTO.TimeFramePerformance> calcTimeFramePerformance(List<Trade> trades) {
        Map<String, List<Trade>> byTf = new LinkedHashMap<>();
        for (Trade t : trades) {
            if (t.getTimeFrames() == null) continue;
            for (String tf : t.getTimeFrames()) {
                byTf.computeIfAbsent(tf, k -> new ArrayList<>()).add(t);
            }
        }
        return byTf.entrySet().stream().map(e -> {
            String tf = e.getKey();
            List<Trade> list = e.getValue();
            long wins = countByOutcome(list, Trade.OutcomeTag.PROFIT);
            BigDecimal wr = list.isEmpty() ? BigDecimal.ZERO
                    : BigDecimal.valueOf(wins * 100.0 / list.size()).setScale(1, RoundingMode.HALF_UP);
            BigDecimal total = sumPnl(list);
            BigDecimal avg = list.isEmpty() ? BigDecimal.ZERO
                    : total.divide(BigDecimal.valueOf(list.size()), 2, RoundingMode.HALF_UP);
            return AnalyticsDTO.TimeFramePerformance.builder()
                    .timeFrame(tf).trades(list.size()).winRate(wr).avgPnl(avg).totalPnl(total)
                    .build();
        })
        .sorted(Comparator.comparingInt(AnalyticsDTO.TimeFramePerformance::getTrades).reversed())
        .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════════════════════
    //  PATTERN DETECTION & DISCIPLINE
    // ══════════════════════════════════════════════════════════

    private List<String> detectRepeatingMistakes(List<Trade> trades) {
        List<String> mistakes = new ArrayList<>();
        long fomoCount = trades.stream()
                .filter(t -> t.getEmotionalState() == Trade.EmotionalState.FOMO).count();
        if (fomoCount >= 2)
            mistakes.add("FOMO pattern detected: " + fomoCount + " FOMO trades — review entry criteria");
        long slBreaches = trades.stream().filter(t -> !t.isSlRespected()).count();
        if (slBreaches >= 2)
            mistakes.add("SL breach pattern: " + slBreaches + " trades with SL ignored — risk management issue");
        long revengeCount = trades.stream()
                .filter(t -> t.getEmotionalState() == Trade.EmotionalState.REVENGE).count();
        if (revengeCount >= 1)
            mistakes.add("Revenge trading detected: " + revengeCount + " trade(s) — step away after losses");
        return mistakes;
    }

    private List<String> detectBestSetups(List<Trade> trades) {
        Map<String, AnalyticsDTO.SetupPerformance> setups = calcSetupPerformance(trades);
        return setups.entrySet().stream()
                .filter(e -> e.getValue().getCount() >= 2
                          && e.getValue().getWinRate().compareTo(BigDecimal.valueOf(70)) >= 0)
                .map(e -> e.getKey() + " setup: " + e.getValue().getWinRate() + "% win rate over "
                        + e.getValue().getCount() + " trades")
                .collect(Collectors.toList());
    }

    private List<String> detectWorstBehaviors(List<Trade> trades) {
        List<String> worst = new ArrayList<>();
        long overtradingDays = trades.stream()
                .filter(t -> t.getTags() != null && t.getTags().contains("#Overtrading")).count();
        if (overtradingDays >= 2)
            worst.add("Overtrading tendency: reduce position frequency");
        long earlyExits = trades.stream()
                .filter(t -> t.getTags() != null && t.getTags().contains("#EarlyExit")).count();
        if (earlyExits >= 2)
            worst.add("Early exit pattern in " + earlyExits + " trades — cutting winners short");
        return worst;
    }

    private List<String> generateRecommendations(List<Trade> trades) {
        List<String> recs = new ArrayList<>();
        BigDecimal winRate = calcWinRate(trades);
        if (winRate.compareTo(BigDecimal.valueOf(50)) < 0)
            recs.add("Win rate below 50% — review setup selection and entry criteria");
        BigDecimal pf = calcProfitFactor(trades);
        if (pf.compareTo(BigDecimal.ONE) < 0 && !trades.isEmpty())
            recs.add("Profit factor below 1.0 — losses exceed gains. Review position sizing");
        long slBreaches = trades.stream().filter(t -> !t.isSlRespected()).count();
        if (slBreaches > 0)
            recs.add("Stop loss breached in " + slBreaches + " trade(s) — enforce SL discipline");
        if (trades.size() >= 5) {
            BigDecimal avgRR = calcAvgRR(trades);
            if (avgRR.compareTo(BigDecimal.ONE) < 0 && avgRR.compareTo(BigDecimal.ZERO) > 0)
                recs.add("Average R:R below 1:1 — aim for minimum 1.5:1 on entries");
        }
        return recs;
    }

    private List<String> detectDisciplineBreaks(List<Trade> trades) {
        List<String> breaks = new ArrayList<>();
        trades.stream()
                .filter(t -> !t.isSlRespected())
                .forEach(t -> breaks.add("SL moved/ignored on " + t.getInstrument()
                        + " (" + (t.getTradeDate() != null ? t.getTradeDate().toLocalDate() : "?") + ")"));
        trades.stream()
                .filter(t -> t.getEmotionalState() == Trade.EmotionalState.REVENGE)
                .forEach(t -> breaks.add("Revenge trade: " + t.getInstrument()));
        trades.stream()
                .filter(t -> t.getTags() != null && t.getTags().contains("#DisciplineBreak"))
                .forEach(t -> breaks.add("Self-tagged discipline break: " + t.getInstrument()));
        return breaks;
    }

    private int calcDisciplineRating(List<Trade> trades) {
        if (trades.isEmpty()) return 100;
        int score = 100;
        long slBreaches = trades.stream().filter(t -> !t.isSlRespected()).count();
        score -= (int)(slBreaches * 10);
        long fomoTrades = trades.stream()
                .filter(t -> t.getEmotionalState() == Trade.EmotionalState.FOMO
                          || t.getEmotionalState() == Trade.EmotionalState.REVENGE).count();
        score -= (int)(fomoTrades * 8);
        long disciplineBreakTags = trades.stream()
                .filter(t -> t.getTags() != null && t.getTags().contains("#DisciplineBreak")).count();
        score -= (int)(disciplineBreakTags * 5);
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
}
