package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    // ─── Auth ─────────────────────────────────────────────
    @Indexed(unique = true)
    private String email;
    private String passwordHash;
    private Role   role;

    // ─── Personal Info ─────────────────────────────────────
    private String fullName;
    private String displayName;        // shown in UI
    private String phone;
    private String city;
    private String country;
    private String avatarBase64;       // Base64 profile picture

    // ─── Trading Identity ──────────────────────────────────
    private ExperienceLevel  experienceLevel;   // BEGINNER / INTERMEDIATE / ADVANCED / PROFESSIONAL
    private TradingStyle     primaryStyle;      // INTRADAY / SWING / POSITIONAL / ALL
    private List<String>     marketsTraded;     // EQUITY, F&O, CRYPTO, COMMODITY, FOREX, INDEX
    private List<String>     platformsUsed;     // Zerodha, Upstox, Angel One, etc.
    private String           primaryBroker;

    // ─── Capital & Risk Profile ────────────────────────────
    private BigDecimal tradingCapital;          // total capital deployed for trading
    private BigDecimal riskPerTradePercent;     // default risk per trade (%)
    private BigDecimal maxDrawdownTolerance;    // max DD they can handle (%)
    private BigDecimal targetMonthlyReturnPct;  // monthly return goal (%)
    private Integer    avgTradesPerMonth;        // approximate trading frequency

    // ─── Goals & Motivation ────────────────────────────────
    private String  tradingGoal;               // "Full-time income", "Supplement salary", etc.
    private String  biggestWeakness;           // Self-reported weakness
    private String  whyImproving;              // What they want to get better at

    // ─── Account Settings ──────────────────────────────────
    private boolean strictMode;                // reject incomplete trade entries
    private boolean emailNotifications;
    private boolean weeklyReportEmail;

    // ─── Account Status ────────────────────────────────────
    private PlanType planType;                 // FREE / PRO / ENTERPRISE
    private boolean  active;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ─── Enums ─────────────────────────────────────────────
    public enum Role { TRADER, MANAGER, ADMIN }

    public enum ExperienceLevel {
        BEGINNER,       // < 1 year
        INTERMEDIATE,   // 1–3 years
        ADVANCED,       // 3–7 years
        PROFESSIONAL    // 7+ years / full-time
    }

    public enum TradingStyle { INTRADAY, SWING, POSITIONAL, ALL }

    public enum PlanType { FREE, PRO, ENTERPRISE }

    // ─── Embedded config (kept for backward compat) ────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TradingConfig {
        private boolean strictMode;
        private BigDecimal defaultRiskPercent;
        private BigDecimal capitalDeployed;
    }
}
