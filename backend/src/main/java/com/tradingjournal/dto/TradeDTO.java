package com.tradingjournal.dto;

import com.tradingjournal.model.Trade;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class TradeDTO {

    // ─── Request DTOs ─────────────────────────────────────────

    @Data
    public static class CreateRequest {

        @NotBlank(message = "Instrument is required")
        private String instrument;

        @NotNull(message = "Instrument type is required")
        private Trade.InstrumentType instrumentType;

        @NotNull(message = "Trade type is required")
        private Trade.TradeType tradeType;

        @NotNull(message = "Direction (BUY/SELL) is required")
        private Trade.Direction direction;

        @NotNull(message = "Entry price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Entry price must be positive")
        private BigDecimal entryPrice;

        @NotNull(message = "Stop loss is required — no SL, no trade")
        @DecimalMin(value = "0.0", inclusive = false, message = "Stop loss must be positive")
        private BigDecimal stopLoss;

        @NotNull(message = "Target is required — define your exit before entry")
        @DecimalMin(value = "0.0", inclusive = false, message = "Target must be positive")
        private BigDecimal target;

        private BigDecimal exitPrice;
        private LocalDateTime tradeDate;
        private LocalDateTime exitDate;

        @NotNull(message = "Position size is required")
        @Min(value = 1, message = "Position size must be at least 1")
        private Integer positionSize;

        private Integer lotSize;
        private BigDecimal riskPerTradePercent;

        @NotNull(message = "Setup type is required — what was your thesis?")
        private Trade.SetupType setupType;

        @NotNull(message = "Market context is required")
        private Trade.MarketContext marketContext;

        // Time frames — multi-select, optional
        private List<String> timeFrames;

        @NotBlank(message = "Explain why you took this trade — vague reasoning is not accepted")
        @Size(min = 20, message = "Be specific — minimum 20 characters. Justify your decision.")
        private String whyTookTrade;

        @NotBlank(message = "Describe your edge or setup logic")
        @Size(min = 20, message = "Minimum 20 characters for edge description")
        private String edgeOrSetupLogic;

        @NotBlank(message = "What confirmation did you use?")
        private String confirmationUsed;

        @NotBlank(message = "Define your invalidation — when would you exit if wrong?")
        private String invalidationReason;

        @NotNull(message = "Rate your emotional state before entry")
        private Trade.EmotionalState emotionalState;

        private Trade.OutcomeTag outcomeTag;
        private BigDecimal pnlAbsolute;
        private BigDecimal pnlPercent;

        private List<String> tags;
        private String notes;
        private String exchange;
        private BigDecimal brokerage;
        private BigDecimal taxes;
        private boolean slRespected = true;

        // Chart images — base64 encoded strings, max 5
        private List<String> chartImageUrls;
    }

    // ── REPLACE the UpdateRequest static class inside TradeDTO.java ──────────────

    @Data
    public static class UpdateRequest {
        // ── Close trade fields ─────────────────────────────────
        private BigDecimal exitPrice; // setting this CLOSES the trade
        private LocalDateTime exitDate; // auto-set to now() if null when exitPrice is set
        private Trade.OutcomeTag outcomeTag; // manual override only (e.g. NO_TRADE)

        // ── Reflection fields ──────────────────────────────────
        private String whatWentRight;
        private String whatWentWrong;
        private String willRepeat;
        private String willAvoid;
        private Integer disciplineScore;

        // ── Other updatable fields ────────────────────────────
        private List<String> tags;
        private List<String> timeFrames;
        private List<String> chartImageUrls; // max 5
        private String notes;
        private boolean slRespected;
        private boolean isReviewed;
    }

    // ─── Response DTOs ────────────────────────────────────────

    @Data
    public static class Response {
        private String id;
        private String tradeId;
        private LocalDateTime tradeDate;
        private LocalDateTime exitDate;
        private String instrument;
        private Trade.InstrumentType instrumentType;
        private Trade.TradeType tradeType;
        private Trade.Direction direction;
        private BigDecimal entryPrice;
        private BigDecimal exitPrice;
        private BigDecimal stopLoss;
        private BigDecimal target;
        private Integer positionSize;
        private Integer lotSize;
        private BigDecimal riskPerTradePercent;
        private Trade.OutcomeTag outcomeTag;
        private BigDecimal pnlAbsolute;
        private BigDecimal pnlPercent;
        private BigDecimal plannedRR;
        private BigDecimal actualRR;
        private Trade.SetupType setupType;
        private Trade.MarketContext marketContext;
        private List<String> timeFrames; // NEW
        private String whyTookTrade;
        private String edgeOrSetupLogic;
        private String confirmationUsed;
        private String invalidationReason;
        private Trade.EmotionalState emotionalState;
        private String whatWentRight;
        private String whatWentWrong;
        private String willRepeat;
        private String willAvoid;
        private Integer disciplineScore;
        private List<String> tags;
        private List<String> chartImageUrls; // base64 or URLs
        private String notes;
        private String exchange;
        private BigDecimal brokerage;
        private BigDecimal taxes;
        private boolean slRespected;
        private boolean isReviewed;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ─── Query DTO ────────────────────────────────────────────

    @Data
    public static class QueryRequest {
        private String instrument;
        private Trade.InstrumentType instrumentType;
        private Trade.OutcomeTag outcomeTag;
        private Trade.EmotionalState emotionalState;
        private Trade.SetupType setupType;
        private Trade.TradeType tradeType;
        private List<String> tags;
        private List<String> timeFrames;
        private Double minRR;
        private Boolean slRespected;
        private LocalDateTime dateFrom;
        private LocalDateTime dateTo;
        private Integer limit;
        private String sortBy;
        private String sortDir;
    }
}
