package com.tradingjournal.exception;

import java.util.List;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
}

class BadRequestExceptionFile {}
