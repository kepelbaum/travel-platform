package com.travelplatform.backend.exception;

public class TripActivityNotFoundException extends RuntimeException {
    public TripActivityNotFoundException(Long tripActivityId) {
        super("Scheduled activity not found with id: " + tripActivityId);
    }

    public TripActivityNotFoundException(Long tripId, Long activityId) {
        super("Activity with id " + activityId + " not found in trip with id: " + tripId);
    }

    public TripActivityNotFoundException(String message) {
        super(message);
    }
}