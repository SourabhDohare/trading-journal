package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "trades")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(def = "{'userId': 1, 'tradeDate': -1}")
@CompoundIndex(def = "{'userId': 1, 'instrument': 1}")
public class Trade {

    @Id
    private String id;

    @Indexed
    private String userId;

    // ─── Core Trade Data ───────────────────────────────────────
    private String tradeId;
    private LocalDateTime tradeDate;
    private LocalDateTime exitDate;

    private String instrument;
    private InstrumentType instrumentType;
    private TradeType tradeType;
    private Direction direction;

    private BigDecimal entryPrice;
    private BigDecimal exitPrice;
    private BigDecimal stopLoss;
    private BigDecimal target;

    private Integer positionSize;
    private Integer lotSize;
    private BigDecimal riskPerTradePercent;
    private BigDecimal riskPerTradeAbsolute;

    private OutcomeTag outcomeTag;
    private BigDecimal pnlAbsolute;
    private BigDecimal pnlPercent;
    private BigDecimal plannedRR;
    private BigDecimal actualRR;

    // ─── Setup & Context ──────────────────────────────────────
    private SetupType setupType;
    private MarketContext marketContext;

    // ─── Time Frames (NEW) ────────────────────────────────────
    // Multiple time frames can be selected per trade
    private List<String> timeFrames;

    // ─── Mandatory Thinking Layer ─────────────────────────────
    private String whyTookTrade;
    private String edgeOrSetupLogic;
    private String confirmationUsed;
    private String invalidationReason;
    private EmotionalState emotionalState;

    // ─── Post-Trade Reflection ────────────────────────────────
    private String whatWentRight;
    private String whatWentWrong;
    private String willRepeat;
    private String willAvoid;
    private Integer disciplineScore;

    // ─── Tags ─────────────────────────────────────────────────
    private List<String> tags;

    // ─── Media (Base64 encoded, max 5 images) ─────────────────
    private List<String> chartImageUrls;   // S3/local paths OR base64 strings
    private String notes;

    // ─── Broker Integration ───────────────────────────────────
    private String brokerId;
    private String brokerTradeId;
    private String exchange;
    private BigDecimal brokerage;
    private BigDecimal taxes;

    // ─── Audit ────────────────────────────────────────────────
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private boolean isReviewed;
    private boolean slRespected;
    private boolean targetAchieved;

    // ─── Enums ────────────────────────────────────────────────
    public enum InstrumentType {
        STOCK, CRYPTO, FO_FUTURES, FO_OPTIONS, FOREX, COMMODITY, INDEX
    }

    public enum TradeType {
        INTRADAY, SWING, POSITIONAL
    }

    public enum Direction {
        BUY, SELL
    }

    public enum OutcomeTag {
        PROFIT, LOSS, BREAKEVEN, NO_TRADE, OPEN
    }

    public enum SetupType {
        BREAKOUT, REVERSAL, PULLBACK, TREND_FOLLOW, RANGE_TRADE,
        GAP_PLAY, MOMENTUM, MEAN_REVERSION, VOLUME_BASED, NEWS_BASED, OTHER
    }

    public enum MarketContext {
        TRENDING_UP, TRENDING_DOWN, RANGING, VOLATILE, NEWS_DRIVEN, CONSOLIDATION
    }

    public enum EmotionalState {
        CALM, FOMO, REVENGE, HESITATION, OVERCONFIDENT, ANXIOUS, DISCIPLINED
    }
}
