package com.tradingjournal.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class StrictModeException extends RuntimeException {
    private final List<String> issues;

    public StrictModeException(String message, List<String> issues) {
        super(message);
        this.issues = issues;
    }
}
