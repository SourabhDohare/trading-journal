package com.tradingjournal.dto;

import com.tradingjournal.model.User;
import lombok.Data;

import java.time.LocalDateTime;

public class UserDTO {

    @Data
    public static class Response {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private User.Role role;
        private boolean strictMode;
        private String timezone;
        private User.TradingConfig tradingConfig;
        private LocalDateTime createdAt;
    }

    @Data
    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String timezone;
        private boolean strictMode;
        private User.TradingConfig tradingConfig;
    }
}
