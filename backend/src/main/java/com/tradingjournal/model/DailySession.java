package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "daily_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(def = "{'userId': 1, 'sessionDate': -1}", unique = true)
public class DailySession {

    @Id
    private String id;

    private String userId;

    private LocalDate sessionDate;

    // Pre-session
    private String preMarketNote;
    private String marketBias;      // Bullish, Bearish, Neutral
    private String keyLevels;       // Support/resistance levels to watch
    private String newsToWatch;

    // Post-session
    private String postMarketNote;
    private String lessonLearned;
    private Integer overallDisciplineScore; // 1-10
    private SessionMood mood;

    // Computed aggregates
    private Integer totalTrades;
    private Integer profitableTrades;
    private Integer losingTrades;
    private BigDecimal totalPnl;
    private BigDecimal winRate;
    private BigDecimal bestTrade;
    private BigDecimal worstTrade;

    private List<String> tradeIds;  // References to trade documents
    private List<String> mistakes;

    private boolean reviewed;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum SessionMood {
        EXCELLENT, GOOD, NEUTRAL, POOR, TERRIBLE
    }
}
