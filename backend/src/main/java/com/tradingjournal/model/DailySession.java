package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "daily_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(def = "{'userId': 1, 'sessionDate': -1}")
public class DailySession {

    @Id
    private String id;

    private String userId;

    // One document per user per day (e.g. "2026-04-07")
    private LocalDate sessionDate;

    // Pre-market
    private String marketBias;      // BULLISH / NEUTRAL / BEARISH
    private String preMarketNotes;
    private String newsToWatch;

    // Post-session
    private String lessonLearned;
    private String sessionMood;     // EXCELLENT / GOOD / NEUTRAL / POOR / TERRIBLE
    private Integer disciplineScore; // 1–10
    private String additionalNotes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
