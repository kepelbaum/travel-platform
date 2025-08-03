package com.travelplatform.backend.exception;

public class TripNotFoundException extends RuntimeException {
    public TripNotFoundException(Long id) {
        super("Trip not found with id: " + id);
    }

    public TripNotFoundException(String message) {
        super(message);
    }
}
