package com.tradingjournal.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

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

    @Indexed(unique = true)
    private String email;

    private String password;

    private String firstName;
    private String lastName;

    private Role role;

    private String teamId;       // For multi-user/team support
    private String managerId;    // Role-based access

    private TradingConfig tradingConfig;

    private boolean strictMode;  // Reject incomplete entries
    private boolean active;

    private String profileImageUrl;
    private String timezone;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    public enum Role {
        TRADER, MANAGER, ADMIN
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TradingConfig {
        private String defaultCurrency;       // INR, USD
        private Double defaultRiskPercent;    // Default risk per trade %
        private Double capitalDeployed;       // Total capital
        private List<String> brokerAccounts;
        private boolean notificationsEnabled;
        private Integer defaultLotSize;
    }
}
