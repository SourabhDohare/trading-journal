package com.tradingjournal.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailySessionDTO {

    @Data
    public static class SaveRequest {
        private String  marketBias;       // BULLISH / NEUTRAL / BEARISH
        private String  preMarketNotes;
        private String  newsToWatch;
        private String  lessonLearned;
        private String  sessionMood;      // EXCELLENT / GOOD / NEUTRAL / POOR / TERRIBLE
        private Integer disciplineScore;  // 1–10
        private String  additionalNotes;
        private LocalDate sessionDate;    // optional — defaults to today on backend
    }

    @Data
    public static class Response {
        private String    id;
        private LocalDate sessionDate;
        private String    marketBias;
        private String    preMarketNotes;
        private String    newsToWatch;
        private String    lessonLearned;
        private String    sessionMood;
        private Integer   disciplineScore;
        private String    additionalNotes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
