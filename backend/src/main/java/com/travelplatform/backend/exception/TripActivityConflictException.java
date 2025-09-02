package com.travelplatform.backend.exception;

// For scheduling conflicts
public class TripActivityConflictException extends RuntimeException {
    public TripActivityConflictException(String message) {
        super(message);
    }
}

