package com.tradingjournal.dto;

import lombok.Data;

public class FeedbackDTO {

    @Data
    public static class ContactRequest {
        private String name;
        private String email;
        private String subject;
        private String message;
    }

    @Data
    public static class FeedbackRequest {
        private int    rating;
        private String category;
        private String whatWorks;
        private String improvements;
        private String featureRequest;
        private String name;
        private String email;
    }
}