package com.travelplatform.backend.exception;

public class ActivityNotFoundException extends RuntimeException {
    public ActivityNotFoundException(Long id) {
        super("Activity not found with id: " + id);
    }

    public ActivityNotFoundException(String message) {
        super(message);
    }
}