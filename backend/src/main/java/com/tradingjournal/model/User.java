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

    private String provider; // "google" | "github" | null
    private String providerId;
    private String avatarUrl;

    // ─── Auth (KEPT EXACTLY as original — DO NOT rename) ──────────────────
    @Indexed(unique = true)
    private String email;

    // UserPrincipal.java calls user.getPassword() — field MUST stay as "password"
    private String password;

    private Role role;

    // ─── Original name fields (AuthService calls getFirstName/getLastName) ─
    private String firstName;
    private String lastName;
    private String timezone; // AuthService references this

    // ─── NEW: unified full name for display (profile page uses this) ────────
    private String fullName; // e.g. "Sourabh Dohare"
    private String displayName; // e.g. "SD" — shown in sidebar

    // ─── NEW: Contact ──────────────────────────────────────────────────────
    private String phone;
    private String city;
    private String country;
    private String avatarBase64; // Base64 profile picture (max ~200KB)

    // ─── NEW: Trading Identity ─────────────────────────────────────────────
    private ExperienceLevel experienceLevel;
    private TradingStyle primaryStyle;
    private List<String> marketsTraded;
    private List<String> platformsUsed;
    private String primaryBroker;

    // ─── NEW: Capital & Risk ───────────────────────────────────────────────
    private BigDecimal tradingCapital;
    private BigDecimal riskPerTradePercent;
    private BigDecimal maxDrawdownTolerance;
    private BigDecimal targetMonthlyReturnPct;
    private Integer avgTradesPerMonth;

    // ─── NEW: Goals ────────────────────────────────────────────────────────
    private String tradingGoal;
    private String biggestWeakness;
    private String whyImproving;

    // ─── NEW: Preferences ─────────────────────────────────────────────────
    private boolean emailNotifications;
    private boolean weeklyReportEmail;

    // ─── Original config (AuthService calls getTradingConfig()) ───────────
    private TradingConfig tradingConfig;

    // strictMode lives in TradingConfig AND directly (used by TradeService)
    private boolean strictMode;

    // ─── Account status ────────────────────────────────────────────────────
    private PlanType planType;
    private boolean active;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ══════════════════════════════════════════════════════════════
    // Enums
    // ══════════════════════════════════════════════════════════════

    public enum Role {
        TRADER, MANAGER, ADMIN
    }

    public enum ExperienceLevel {
        BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL
    }

    public enum TradingStyle {
        INTRADAY, SWING, POSITIONAL, ALL
    }

    public enum PlanType {
        FREE, PRO, ENTERPRISE
    }

    // ─── TradingConfig (kept for backward compat — AuthService uses it) ────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TradingConfig {
        private boolean strictMode;
        private BigDecimal defaultRiskPercent;
        private BigDecimal capitalDeployed;
    }

    // ─── Helper: get effective display name ───────────────────────────────
    // Used in places that need a user-facing name
    public String getEffectiveDisplayName() {
        if (displayName != null && !displayName.isBlank())
            return displayName;
        if (fullName != null && !fullName.isBlank())
            return fullName;
        if (firstName != null && !firstName.isBlank())
            return firstName + (lastName != null ? " " + lastName : "");
        return email;
    }
}