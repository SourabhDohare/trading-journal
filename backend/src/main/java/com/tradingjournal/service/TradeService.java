package com.tradingjournal.service;

import com.tradingjournal.dto.TradeDTO;
import com.tradingjournal.exception.ResourceNotFoundException;
import com.tradingjournal.exception.ValidationException;
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

    private final TradeRepository            tradeRepository;
    private final UserRepository             userRepository;
    private final AnalyticsService           analyticsService;
    private final TradeNotificationService   notificationService;

    private static final DateTimeFormatter TRADE_ID_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    // ─── Create ───────────────────────────────────────────────────────────────

    public TradeDTO.Response createTrade(String userId, TradeDTO.CreateRequest request) {
        // Strict mode: reject if required thinking-layer fields are missing
        enforceStrictMode(userId, request);

        Trade trade = buildTrade(userId, request);
        autoTagTrade(trade);
        trade = tradeRepository.save(trade);

        // Fire-and-forget email notifications
        notificationService.onTradeLogged(trade, userId);
        checkAndNotifyDisciplineBreak(trade, userId);

        log.info("Trade created: {} for user: {}", trade.getTradeId(), userId);
        return mapToResponse(trade);
    }

    // ─── Update (close trade + reflection) ───────────────────────────────────

    public TradeDTO.Response updateTrade(String tradeId, String userId,
                                         TradeDTO.UpdateRequest request) {
        Trade trade = tradeRepository.findByIdAndUserId(tradeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found: " + tradeId));

        // Reflection fields
        if (request.getWhatWentRight()   != null) trade.setWhatWentRight(request.getWhatWentRight());
        if (request.getWhatWentWrong()   != null) trade.setWhatWentWrong(request.getWhatWentWrong());
        if (request.getWillRepeat()      != null) trade.setWillRepeat(request.getWillRepeat());
        if (request.getWillAvoid()       != null) trade.setWillAvoid(request.getWillAvoid());
        if (request.getDisciplineScore() != null) trade.setDisciplineScore(request.getDisciplineScore());
        if (request.getNotes()           != null) trade.setNotes(request.getNotes());
        if (request.getTags()            != null) trade.setTags(new ArrayList<>(request.getTags()));
        if (request.getTimeFrames()      != null) trade.setTimeFrames(new ArrayList<>(request.getTimeFrames()));
        if (request.getChartImageUrls()  != null) {
            List<String> imgs = new ArrayList<>(request.getChartImageUrls());
            if (imgs.size() > 5) imgs = imgs.subList(0, 5);
            trade.setChartImageUrls(imgs);
        }
        trade.setSlRespected(request.isSlRespected());
        trade.setReviewed(request.isReviewed());

        // Close trade when exit price is provided
        boolean closing = request.getExitPrice() != null
                && request.getExitPrice().compareTo(BigDecimal.ZERO) > 0;

        if (closing) {
            trade.setExitPrice(request.getExitPrice());
            trade.setExitDate(request.getExitDate() != null
                    ? request.getExitDate() : LocalDateTime.now());
            recalculatePnl(trade);
        } else if (request.getOutcomeTag() != null) {
            trade.setOutcomeTag(request.getOutcomeTag());
        }

        Trade saved = tradeRepository.save(trade);

        if (closing) {
            notificationService.onTradeClosed(saved, userId);
            checkAndNotifyDisciplineBreak(saved, userId);
        }

        return mapToResponse(saved);
    }

    // ─── Query ────────────────────────────────────────────────────────────────

    public Page<TradeDTO.Response> getTrades(String userId, int page, int size,
                                              String sortBy, String sortDir) {
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
        } else if (query.getInstrumentType() != null) {
            trades = tradeRepository.findByUserIdAndInstrumentType(userId, query.getInstrumentType());
        } else if (query.getLimit() != null) {
            Pageable pageable = PageRequest.of(0, query.getLimit(), Sort.by("tradeDate").descending());
            trades = tradeRepository.findByUserIdOrderByTradeDateDesc(userId, pageable).getContent();
        } else {
            trades = tradeRepository.findByUserIdOrderByTradeDateDesc(
                    userId, PageRequest.of(0, 10000)).getContent();
        }

        return trades.stream().map(this::mapToResponse).toList();
    }

    public void deleteTrade(String userId, String tradeId) {
        Trade trade = tradeRepository.findByIdAndUserId(tradeId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Trade not found: " + tradeId));
        tradeRepository.delete(trade);
        log.info("Trade deleted: {} by user: {}", tradeId, userId);
    }

    // ─── Strict Mode ──────────────────────────────────────────────────────────
    // Single enforcement point — no duplicate check

    private void enforceStrictMode(String userId, TradeDTO.CreateRequest req) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isStrictMode()) return;

        List<String> missing = new ArrayList<>();
        if (req.getWhyTookTrade()       == null || req.getWhyTookTrade().isBlank())
            missing.add("Why Took Trade");
        if (req.getEdgeOrSetupLogic()   == null || req.getEdgeOrSetupLogic().isBlank())
            missing.add("Edge / Setup Logic");
        if (req.getConfirmationUsed()   == null || req.getConfirmationUsed().isBlank())
            missing.add("Confirmation Used");
        if (req.getInvalidationReason() == null || req.getInvalidationReason().isBlank())
            missing.add("Invalidation Condition");
        if (req.getEmotionalState()     == null) missing.add("Emotional State");
        if (req.getSetupType()          == null) missing.add("Setup Type");

        if (!missing.isEmpty()) {
            throw new ValidationException(
                    "Strict Mode is ON — missing required fields: " + String.join(", ", missing));
        }
    }

    // ─── Discipline Break Detector ────────────────────────────────────────────

    private void checkAndNotifyDisciplineBreak(Trade trade, String userId) {
        List<String> reasons = new ArrayList<>();

        if (!trade.isSlRespected())
            reasons.add("Stop loss was moved or ignored on this trade");

        if (trade.getEmotionalState() == Trade.EmotionalState.FOMO)
            reasons.add("Trade entered in FOMO state — review your entry criteria");
        if (trade.getEmotionalState() == Trade.EmotionalState.REVENGE)
            reasons.add("Revenge trade detected — step away from the screen after losses");
        if (trade.getEmotionalState() == Trade.EmotionalState.OVERCONFIDENT)
            reasons.add("Overconfidence detected — size and risk may be inflated");

        if (trade.getTags() != null && trade.getTags().contains("#DisciplineBreak"))
            reasons.add("Self-tagged as a discipline break");

        if (!reasons.isEmpty()) {
            notificationService.onDisciplineBreak(trade, userId, String.join(" · ", reasons));
        }
    }

    // ─── Build Trade ──────────────────────────────────────────────────────────

    private Trade buildTrade(String userId, TradeDTO.CreateRequest req) {
        long count   = tradeRepository.countByUserId(userId);
        String tradeId = "TRD-" + LocalDateTime.now().format(TRADE_ID_FORMAT)
                + "-" + String.format("%04d", count + 1);

        List<String> chartImages = req.getChartImageUrls();
        if (chartImages != null && chartImages.size() > 5)
            chartImages = chartImages.subList(0, 5);

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

        calculateMetrics(trade, req);

        if (req.getExitPrice() != null && req.getEntryPrice() != null)
            recalculatePnl(trade);

        return trade;
    }

    private void calculateMetrics(Trade trade, TradeDTO.CreateRequest req) {
        if (req.getEntryPrice() != null && req.getStopLoss() != null && req.getTarget() != null) {
            BigDecimal risk   = req.getEntryPrice().subtract(req.getStopLoss()).abs();
            BigDecimal reward = req.getTarget().subtract(req.getEntryPrice()).abs();
            if (risk.compareTo(BigDecimal.ZERO) > 0)
                trade.setPlannedRR(reward.divide(risk, 2, RoundingMode.HALF_UP));
        }
        if (req.getEntryPrice() != null && req.getStopLoss() != null && req.getPositionSize() != null) {
            boolean isFnO = req.getInstrumentType() == Trade.InstrumentType.FO_FUTURES
                    || req.getInstrumentType() == Trade.InstrumentType.FO_OPTIONS;
            int ls = (isFnO && req.getLotSize() != null && req.getLotSize() > 0) ? req.getLotSize() : 1;
            trade.setRiskPerTradeAbsolute(req.getEntryPrice().subtract(req.getStopLoss()).abs()
                    .multiply(BigDecimal.valueOf((long) req.getPositionSize() * ls)));
        }
    }

    private void recalculatePnl(Trade trade) {
        if (trade.getExitPrice() == null || trade.getEntryPrice() == null) return;

        BigDecimal priceDiff = trade.getDirection() == Trade.Direction.BUY
                ? trade.getExitPrice().subtract(trade.getEntryPrice())
                : trade.getEntryPrice().subtract(trade.getExitPrice());

        boolean isFnO = trade.getInstrumentType() == Trade.InstrumentType.FO_FUTURES
                || trade.getInstrumentType() == Trade.InstrumentType.FO_OPTIONS;
        int ls = (isFnO && trade.getLotSize() != null && trade.getLotSize() > 0) ? trade.getLotSize() : 1;

        BigDecimal grossPnl = priceDiff.multiply(BigDecimal.valueOf((long) trade.getPositionSize() * ls));
        BigDecimal costs    = BigDecimal.ZERO;
        if (trade.getBrokerage() != null) costs = costs.add(trade.getBrokerage());
        if (trade.getTaxes()     != null) costs = costs.add(trade.getTaxes());
        BigDecimal netPnl = grossPnl.subtract(costs);

        trade.setPnlAbsolute(netPnl);
        if (trade.getEntryPrice().compareTo(BigDecimal.ZERO) > 0) {
            trade.setPnlPercent(priceDiff.divide(trade.getEntryPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)));
        }

        int cmp = netPnl.compareTo(BigDecimal.ZERO);
        if      (cmp > 0) trade.setOutcomeTag(Trade.OutcomeTag.PROFIT);
        else if (cmp < 0) trade.setOutcomeTag(Trade.OutcomeTag.LOSS);
        else              trade.setOutcomeTag(Trade.OutcomeTag.BREAKEVEN);

        if (trade.getStopLoss() != null) {
            BigDecimal risk = trade.getEntryPrice().subtract(trade.getStopLoss()).abs();
            if (risk.compareTo(BigDecimal.ZERO) > 0)
                trade.setActualRR(priceDiff.divide(risk, 2, RoundingMode.HALF_UP));
        }
    }

    private void autoTagTrade(Trade trade) {
        List<String> tags = trade.getTags() != null ? new ArrayList<>(trade.getTags()) : new ArrayList<>();
        if (trade.getEmotionalState() == Trade.EmotionalState.FOMO)    tags.add("#FOMO");
        if (trade.getEmotionalState() == Trade.EmotionalState.REVENGE)  tags.add("#Revenge");
        if (trade.getPlannedRR() != null && trade.getPlannedRR().compareTo(BigDecimal.valueOf(2)) >= 0)
            tags.add("#HighRR");
        if (trade.getConfirmationUsed() != null && trade.getConfirmationUsed().length() > 50)
            tags.add("#HighConfidence");
        trade.setTags(tags);
    }

    // ─── Map to Response ──────────────────────────────────────────────────────

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