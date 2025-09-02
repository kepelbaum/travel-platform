package com.travelplatform.backend.exception;

// For date range violations
public class TripDateValidationException extends RuntimeException {
    public TripDateValidationException(String message) {
        super(message);
    }
}