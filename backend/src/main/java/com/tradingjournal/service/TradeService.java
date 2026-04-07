package com.tradingjournal.service;

import com.tradingjournal.dto.TradeDTO;
import com.tradingjournal.exception.ResourceNotFoundException;
import com.tradingjournal.exception.StrictModeException;
import com.tradingjournal.model.Trade;
import com.tradingjournal.model.User;
import com.tradingjournal.repository.TradeRepository;
import com.tradingjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeService {

    private final TradeRepository tradeRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;

    private static final DateTimeFormatter TRADE_ID_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    // ─── Create Trade ─────────────────────────────────────────

    public TradeDTO.Response createTrade(String userId, TradeDTO.CreateRequest request) {
        User user = getUserById(userId);

        // Strict mode validation
        if (user.isStrictMode()) {
            validateStrictMode(request);
        }

        Trade trade = buildTrade(userId, request);
        calculateMetrics(trade, request);
        autoTagTrade(trade);

        trade = tradeRepository.save(trade);
        log.info("Trade created: {} for user: {}", trade.getTradeId(), userId);

        return mapToResponse(trade);
    }

    // ─── Update Trade (post-trade reflection) ─────────────────

    // ── REPLACE the entire updateTrade() method in TradeService.java ─────────────

public TradeDTO.Response updateTrade(String tradeId, String userId, TradeDTO.UpdateRequest request) {
    Trade trade = tradeRepository.findByIdAndUserId(tradeId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Trade not found: " + tradeId));

    // ── Reflection fields ───────────────────────────────────────────────────
    if (request.getWhatWentRight()  != null) trade.setWhatWentRight(request.getWhatWentRight());
    if (request.getWhatWentWrong()  != null) trade.setWhatWentWrong(request.getWhatWentWrong());
    if (request.getWillRepeat()     != null) trade.setWillRepeat(request.getWillRepeat());
    if (request.getWillAvoid()      != null) trade.setWillAvoid(request.getWillAvoid());
    if (request.getDisciplineScore()!= null) trade.setDisciplineScore(request.getDisciplineScore());
    if (request.getNotes()          != null) trade.setNotes(request.getNotes());
    if (request.getTags()           != null) trade.setTags(new ArrayList<>(request.getTags()));
    if (request.getTimeFrames()     != null) trade.setTimeFrames(new ArrayList<>(request.getTimeFrames()));
    if (request.getChartImageUrls() != null) {
        List<String> imgs = new ArrayList<>(request.getChartImageUrls());
        if (imgs.size() > 5) imgs = imgs.subList(0, 5);
        trade.setChartImageUrls(imgs);
    }
    trade.setSlRespected(request.isSlRespected());
    trade.setReviewed(request.isReviewed());

    // ── CLOSE TRADE: when exit price is provided ────────────────────────────
    // This is the critical path — sets exitPrice then recalculates everything
    if (request.getExitPrice() != null
            && request.getExitPrice().compareTo(BigDecimal.ZERO) > 0) {

        trade.setExitPrice(request.getExitPrice());
        trade.setExitDate(request.getExitDate() != null
                ? request.getExitDate()
                : LocalDateTime.now());

        // recalculatePnl() will:
        // 1. Compute gross P&L from price diff × qty × lotSize
        // 2. Deduct brokerage + taxes
        // 3. Set outcomeTag = PROFIT / LOSS / BREAKEVEN from net P&L
        // 4. Set actualRR
        recalculatePnl(trade);

    } else if (request.getOutcomeTag() != null) {
        // Manual override (e.g. NO_TRADE) when no exit price
        trade.setOutcomeTag(request.getOutcomeTag());
    }

    Trade saved = tradeRepository.save(trade);
    return mapToResponse(saved);
}


    // ─── Query Trades ─────────────────────────────────────────

    public Page<TradeDTO.Response> getTrades(String userId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return tradeRepository.findByUserIdOrderByTradeDateDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    public TradeDTO.Response getTradeById(String userId, String tradeId) {
        Trade trade = tradeRepository.findByIdAndUserId(tradeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found: " + tradeId));
        return mapToResponse(trade);
    }

    public List<TradeDTO.Response> queryTrades(String userId, TradeDTO.QueryRequest query) {
        List<Trade> trades;

        if (query.getTags() != null && !query.getTags().isEmpty()) {
            trades = tradeRepository.findByUserIdAndTagsIn(userId, query.getTags());
        } else if (query.getOutcomeTag() != null) {
            trades = tradeRepository.findByUserIdAndOutcomeTag(userId, query.getOutcomeTag());
        } else if (query.getEmotionalState() != null) {
            trades = tradeRepository.findByUserIdAndEmotionalState(userId, query.getEmotionalState());
        } else if (query.getSetupType() != null) {
            trades = tradeRepository.findByUserIdAndSetupType(userId, query.getSetupType());
        } else if (Boolean.FALSE.equals(query.getSlRespected())) {
            trades = tradeRepository.findSlBreaches(userId);
        } else if (query.getMinRR() != null) {
            trades = tradeRepository.findByUserIdAndActualRRGreaterThanEqual(userId, query.getMinRR());
        } else if (query.getDateFrom() != null && query.getDateTo() != null) {
            trades = tradeRepository.findByUserIdAndTradeDateBetweenOrderByTradeDateDesc(
                    userId, query.getDateFrom(), query.getDateTo());
        } else if (query.getLimit() != null) {
            Pageable pageable = PageRequest.of(0, query.getLimit(), Sort.by("tradeDate").descending());
            trades = tradeRepository.findByUserIdOrderByTradeDateDesc(userId, pageable).getContent();
        } // Add this condition in queryTrades() in TradeService.java
        else if (query.getInstrumentType() != null) {
            trades = tradeRepository.findByUserIdAndInstrumentType(userId, query.getInstrumentType());
        } else {
            trades = tradeRepository.findByUserIdOrderByTradeDateDesc(userId, PageRequest.of(0, 10000)).getContent();
        }

        return trades.stream().map(this::mapToResponse).toList();
    }

    public void deleteTrade(String userId, String tradeId) {
        Trade trade = tradeRepository.findByIdAndUserId(tradeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found: " + tradeId));
        tradeRepository.delete(trade);
        log.info("Trade deleted: {} by user: {}", tradeId, userId);
    }

    // ─── Private Helpers ──────────────────────────────────────

    private Trade buildTrade(String userId, TradeDTO.CreateRequest req) {
        long count = tradeRepository.countByUserId(userId);
        String tradeId = "TRD-" + LocalDateTime.now().format(TRADE_ID_FORMAT)
                + "-" + String.format("%04d", count + 1);

        // Validate chart images — max 5
        List<String> chartImages = req.getChartImageUrls();
        if (chartImages != null && chartImages.size() > 5) {
            chartImages = chartImages.subList(0, 5);
        }

        Trade trade = Trade.builder()
                .tradeId(tradeId)
                .userId(userId)
                .tradeDate(req.getTradeDate() != null ? req.getTradeDate() : LocalDateTime.now())
                .exitDate(req.getExitDate())
                .instrument(req.getInstrument().toUpperCase())
                .instrumentType(req.getInstrumentType())
                .tradeType(req.getTradeType())
                .direction(req.getDirection())
                .entryPrice(req.getEntryPrice())
                .exitPrice(req.getExitPrice())
                .stopLoss(req.getStopLoss())
                .target(req.getTarget())
                .positionSize(req.getPositionSize())
                .lotSize(req.getLotSize())
                .riskPerTradePercent(req.getRiskPerTradePercent())
                .setupType(req.getSetupType())
                .marketContext(req.getMarketContext())
                .timeFrames(req.getTimeFrames() != null ? new ArrayList<>(req.getTimeFrames()) : new ArrayList<>())
                .whyTookTrade(req.getWhyTookTrade())
                .edgeOrSetupLogic(req.getEdgeOrSetupLogic())
                .confirmationUsed(req.getConfirmationUsed())
                .invalidationReason(req.getInvalidationReason())
                .emotionalState(req.getEmotionalState())
                .outcomeTag(req.getOutcomeTag() != null ? req.getOutcomeTag() : Trade.OutcomeTag.OPEN)
                .pnlAbsolute(req.getPnlAbsolute())
                .pnlPercent(req.getPnlPercent())
                .tags(req.getTags() != null ? new ArrayList<>(req.getTags()) : new ArrayList<>())
                .notes(req.getNotes())
                .exchange(req.getExchange())
                .brokerage(req.getBrokerage())
                .taxes(req.getTaxes())
                .slRespected(req.isSlRespected())
                .chartImageUrls(chartImages != null ? new ArrayList<>(chartImages) : new ArrayList<>())
                .build();

        // ── Calculate metrics (planned RR, risk amount) ─────────────────────────
        calculateMetrics(trade, req);

        // ── If exit price is provided, recalculate PnL and auto-set outcomeTag ──
        // recalculatePnl() will ALWAYS override the outcomeTag with the correct
        // value derived from actual price movement (after brokerage/taxes deducted)
        if (req.getExitPrice() != null && req.getEntryPrice() != null) {
            recalculatePnl(trade);
        }

        return trade;
    }

    // ── REPLACE calculateMetrics() — planned RR and risk amount only ────────────

    private void calculateMetrics(Trade trade, TradeDTO.CreateRequest req) {
        // Planned R:R
        if (req.getEntryPrice() != null && req.getStopLoss() != null && req.getTarget() != null) {
            BigDecimal risk = req.getEntryPrice().subtract(req.getStopLoss()).abs();
            BigDecimal reward = req.getTarget().subtract(req.getEntryPrice()).abs();
            if (risk.compareTo(BigDecimal.ZERO) > 0) {
                trade.setPlannedRR(reward.divide(risk, 2, RoundingMode.HALF_UP));
            }
        }

        // Risk per trade in absolute amount
        if (req.getEntryPrice() != null && req.getStopLoss() != null && req.getPositionSize() != null) {
            boolean isFnO = req.getInstrumentType() == Trade.InstrumentType.FO_FUTURES
                    || req.getInstrumentType() == Trade.InstrumentType.FO_OPTIONS;
            int effectiveLotSize = (isFnO && req.getLotSize() != null && req.getLotSize() > 0)
                    ? req.getLotSize()
                    : 1;
            BigDecimal riskPerUnit = req.getEntryPrice().subtract(req.getStopLoss()).abs();
            trade.setRiskPerTradeAbsolute(riskPerUnit.multiply(
                    BigDecimal.valueOf((long) req.getPositionSize() * effectiveLotSize)));
        }
    }

    // ── REPLACE recalculatePnl() — this is the source of truth for outcomeTag ──

    private void recalculatePnl(Trade trade) {
        if (trade.getExitPrice() == null || trade.getEntryPrice() == null)
            return;

        BigDecimal priceDiff = trade.getDirection() == Trade.Direction.BUY
                ? trade.getExitPrice().subtract(trade.getEntryPrice())
                : trade.getEntryPrice().subtract(trade.getExitPrice());

        // lotSize only applies to F&O instruments
        boolean isFnO = trade.getInstrumentType() == Trade.InstrumentType.FO_FUTURES
                || trade.getInstrumentType() == Trade.InstrumentType.FO_OPTIONS;
        int effectiveLotSize = (isFnO && trade.getLotSize() != null && trade.getLotSize() > 0)
                ? trade.getLotSize()
                : 1;

        BigDecimal totalQty = BigDecimal.valueOf((long) trade.getPositionSize() * effectiveLotSize);
        BigDecimal grossPnl = priceDiff.multiply(totalQty);

        // Deduct transaction costs
        BigDecimal costs = BigDecimal.ZERO;
        if (trade.getBrokerage() != null)
            costs = costs.add(trade.getBrokerage());
        if (trade.getTaxes() != null)
            costs = costs.add(trade.getTaxes());

        BigDecimal netPnl = grossPnl.subtract(costs);
        trade.setPnlAbsolute(netPnl);

        if (trade.getEntryPrice().compareTo(BigDecimal.ZERO) > 0) {
            trade.setPnlPercent(priceDiff
                    .divide(trade.getEntryPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)));
        }

        // ── Auto-set outcomeTag from NET P&L (catches BREAKEVEN + brokerage = LOSS)
        int cmp = netPnl.compareTo(BigDecimal.ZERO);
        if (cmp > 0)
            trade.setOutcomeTag(Trade.OutcomeTag.PROFIT);
        else if (cmp < 0)
            trade.setOutcomeTag(Trade.OutcomeTag.LOSS);
        else
            trade.setOutcomeTag(Trade.OutcomeTag.BREAKEVEN);

        // ── Actual R:R
        if (trade.getStopLoss() != null) {
            BigDecimal risk = trade.getEntryPrice().subtract(trade.getStopLoss()).abs();
            if (risk.compareTo(BigDecimal.ZERO) > 0) {
                trade.setActualRR(priceDiff.divide(risk, 2, RoundingMode.HALF_UP));
            }
        }
    }

    private void autoTagTrade(Trade trade) {
        List<String> tags = trade.getTags() != null ? new ArrayList<>(trade.getTags()) : new ArrayList<>();

        // Auto-tag based on emotional state
        if (trade.getEmotionalState() == Trade.EmotionalState.FOMO)
            tags.add("#FOMO");
        if (trade.getEmotionalState() == Trade.EmotionalState.REVENGE)
            tags.add("#Revenge");

        // Auto-tag based on R:R
        if (trade.getPlannedRR() != null && trade.getPlannedRR().compareTo(BigDecimal.valueOf(2)) >= 0) {
            tags.add("#HighRR");
        }

        // Auto-tag confidence based on multiple confirmations
        if (trade.getConfirmationUsed() != null && trade.getConfirmationUsed().length() > 50) {
            tags.add("#HighConfidence");
        }

        trade.setTags(tags);
    }

    private void validateStrictMode(TradeDTO.CreateRequest req) {
        List<String> issues = new ArrayList<>();

        if (req.getStopLoss() == null)
            issues.add("Stop Loss is mandatory in Strict Mode");
        if (req.getTarget() == null)
            issues.add("Target is mandatory in Strict Mode");
        if (req.getWhyTookTrade() == null || req.getWhyTookTrade().length() < 30) {
            issues.add("Trade reason must be at least 30 characters — be specific");
        }
        if (req.getEdgeOrSetupLogic() == null || req.getEdgeOrSetupLogic().length() < 30) {
            issues.add("Edge logic must be at least 30 characters");
        }
        if (req.getEmotionalState() == Trade.EmotionalState.FOMO ||
                req.getEmotionalState() == Trade.EmotionalState.REVENGE) {
            issues.add("FOMO/Revenge trades are flagged — are you sure? Proceed only with full awareness.");
        }

        if (!issues.isEmpty()) {
            throw new StrictModeException("Strict Mode: Trade entry rejected", issues);
        }
    }

    private User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private TradeDTO.Response mapToResponse(Trade trade) {
        TradeDTO.Response resp = new TradeDTO.Response();
        resp.setId(trade.getId());
        resp.setTradeId(trade.getTradeId());
        resp.setTradeDate(trade.getTradeDate());
        resp.setExitDate(trade.getExitDate());
        resp.setInstrument(trade.getInstrument());
        resp.setInstrumentType(trade.getInstrumentType());
        resp.setTradeType(trade.getTradeType());
        resp.setDirection(trade.getDirection());
        resp.setEntryPrice(trade.getEntryPrice());
        resp.setExitPrice(trade.getExitPrice());
        resp.setStopLoss(trade.getStopLoss());
        resp.setTarget(trade.getTarget());
        resp.setPositionSize(trade.getPositionSize());
        resp.setLotSize(trade.getLotSize());
        resp.setRiskPerTradePercent(trade.getRiskPerTradePercent());
        resp.setOutcomeTag(trade.getOutcomeTag());
        resp.setPnlAbsolute(trade.getPnlAbsolute());
        resp.setPnlPercent(trade.getPnlPercent());
        resp.setPlannedRR(trade.getPlannedRR());
        resp.setActualRR(trade.getActualRR());
        resp.setSetupType(trade.getSetupType());
        resp.setMarketContext(trade.getMarketContext());
        resp.setWhyTookTrade(trade.getWhyTookTrade());
        resp.setEdgeOrSetupLogic(trade.getEdgeOrSetupLogic());
        resp.setConfirmationUsed(trade.getConfirmationUsed());
        resp.setInvalidationReason(trade.getInvalidationReason());
        resp.setEmotionalState(trade.getEmotionalState());
        resp.setWhatWentRight(trade.getWhatWentRight());
        resp.setWhatWentWrong(trade.getWhatWentWrong());
        resp.setWillRepeat(trade.getWillRepeat());
        resp.setWillAvoid(trade.getWillAvoid());
        resp.setDisciplineScore(trade.getDisciplineScore());
        resp.setTags(trade.getTags());
        resp.setChartImageUrls(trade.getChartImageUrls());
        resp.setNotes(trade.getNotes());
        resp.setExchange(trade.getExchange());
        resp.setBrokerage(trade.getBrokerage());
        resp.setTaxes(trade.getTaxes());
        resp.setSlRespected(trade.isSlRespected());
        resp.setReviewed(trade.isReviewed());
        resp.setCreatedAt(trade.getCreatedAt());
        resp.setUpdatedAt(trade.getUpdatedAt());
        resp.setTimeFrames(trade.getTimeFrames());
        return resp;
    }
}
