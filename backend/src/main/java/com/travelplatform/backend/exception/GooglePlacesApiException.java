package com.travelplatform.backend.exception;

public class GooglePlacesApiException extends RuntimeException {
    public GooglePlacesApiException(String message) {
        super(message);
    }
}
