package com.tradingjournal.dto;

import com.tradingjournal.model.User;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class UserProfileDTO {

    // ─── What the frontend receives ───────────────────────────────────────────
    @Data
    public static class Response {
        private String id;
        private String email;
        private String fullName;
        private String displayName;
        private String phone;
        private String city;
        private String country;
        private String avatarBase64;

        private User.ExperienceLevel experienceLevel;
        private User.TradingStyle    primaryStyle;
        private List<String>         marketsTraded;
        private List<String>         platformsUsed;
        private String               primaryBroker;

        private BigDecimal tradingCapital;
        private BigDecimal riskPerTradePercent;
        private BigDecimal maxDrawdownTolerance;
        private BigDecimal targetMonthlyReturnPct;
        private Integer    avgTradesPerMonth;

        private String tradingGoal;
        private String biggestWeakness;
        private String whyImproving;

        private boolean  strictMode;
        private boolean  emailNotifications;
        private boolean  weeklyReportEmail;

        private User.Role     role;
        private User.PlanType planType;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    // ─── What the frontend sends to update ───────────────────────────────────
    @Data
    public static class UpdateRequest {
        private String fullName;
        private String displayName;
        private String phone;
        private String city;
        private String country;
        private String avatarBase64;           // Base64 string, max ~200KB

        private User.ExperienceLevel experienceLevel;
        private User.TradingStyle    primaryStyle;
        private List<String>         marketsTraded;
        private List<String>         platformsUsed;
        private String               primaryBroker;

        private BigDecimal tradingCapital;
        private BigDecimal riskPerTradePercent;
        private BigDecimal maxDrawdownTolerance;
        private BigDecimal targetMonthlyReturnPct;
        private Integer    avgTradesPerMonth;

        private String tradingGoal;
        private String biggestWeakness;
        private String whyImproving;

        private Boolean strictMode;
        private Boolean emailNotifications;
        private Boolean weeklyReportEmail;
    }
}
