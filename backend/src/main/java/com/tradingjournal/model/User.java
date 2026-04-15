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

    // ─── OAuth2 ────────────────────────────────────────────────────────────
    private String provider;    // "google" | "github" | null
    private String providerId;
    private String avatarUrl;

    // ── Email verification ─────────────────────────────────────────────────
    // FIX: @Builder.Default ensures new Builder() calls start with false
    // Without this, Lombok Builder ignores the field initialiser
    @Builder.Default
    private boolean emailVerified = false;

    // ─── Auth ──────────────────────────────────────────────────────────────
    @Indexed(unique = true)
    private String email;
    private String password;    // UserPrincipal calls getPassword() — keep as "password"
    private Role   role;

    // ─── Name ──────────────────────────────────────────────────────────────
    private String firstName;
    private String lastName;
    private String timezone;
    private String fullName;
    private String displayName;

    // ─── Contact ───────────────────────────────────────────────────────────
    private String phone;
    private String city;
    private String country;
    private String avatarBase64;

    // ─── Trading Identity ──────────────────────────────────────────────────
    private ExperienceLevel experienceLevel;
    private TradingStyle    primaryStyle;
    private List<String>    marketsTraded;
    private List<String>    platformsUsed;
    private String          primaryBroker;

    // ─── Capital & Risk ────────────────────────────────────────────────────
    private BigDecimal tradingCapital;
    private BigDecimal riskPerTradePercent;
    private BigDecimal maxDrawdownTolerance;
    private BigDecimal targetMonthlyReturnPct;
    private Integer    avgTradesPerMonth;

    // ─── Goals ────────────────────────────────────────────────────────────
    private String tradingGoal;
    private String biggestWeakness;
    private String whyImproving;

    // ─── Preferences ──────────────────────────────────────────────────────
    // FIX: @Builder.Default = true so new users get notifications ON by default
    // Without @Builder.Default, builder ignores the field initialiser → false
    @Builder.Default private boolean emailNotifications = true;
    @Builder.Default private boolean weeklyReportEmail  = true;

    // ─── Config ────────────────────────────────────────────────────────────
    private TradingConfig tradingConfig;
    @Builder.Default private boolean strictMode = false;

    // ─── Account ───────────────────────────────────────────────────────────
    private PlanType planType;
    @Builder.Default private boolean active = true;

    @CreatedDate      private LocalDateTime createdAt;
    @LastModifiedDate private LocalDateTime updatedAt;

    // ── Enums ─────────────────────────────────────────────────────────────
    public enum Role { TRADER, MANAGER, ADMIN }
    public enum ExperienceLevel { BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL }
    public enum TradingStyle { INTRADAY, SWING, POSITIONAL, ALL }
    public enum PlanType { FREE, PRO, ENTERPRISE }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TradingConfig {
        private boolean    strictMode;
        private BigDecimal defaultRiskPercent;
        private BigDecimal capitalDeployed;
    }

    public String getEffectiveDisplayName() {
        if (displayName != null && !displayName.isBlank()) return displayName;
        if (fullName    != null && !fullName.isBlank())    return fullName;
        if (firstName   != null && !firstName.isBlank())
            return firstName + (lastName != null ? " " + lastName : "");
        return email;
    }
}