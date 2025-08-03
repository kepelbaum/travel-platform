package com.travelplatform.backend.exception;

public class DestinationNotFoundException extends RuntimeException {
    public DestinationNotFoundException(Long id) {
        super("Destination not found with id: " + id);
    }

    public DestinationNotFoundException(String message) {
        super(message);
    }
}