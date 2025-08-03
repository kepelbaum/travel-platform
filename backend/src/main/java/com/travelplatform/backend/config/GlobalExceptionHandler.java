package com.travelplatform.backend.config;

import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.exception.DestinationNotFoundException;
import com.travelplatform.backend.exception.TripActivityNotFoundException;
import com.travelplatform.backend.exception.TripNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ActivityNotFoundException.class)
    public ResponseEntity<Void> handleActivityNotFound(ActivityNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(TripActivityNotFoundException.class)
    public ResponseEntity<Void> handleTripActivityNotFound(TripActivityNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(DestinationNotFoundException.class)
    public ResponseEntity<Void> handleDestinationNotFound(DestinationNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(TripNotFoundException.class)
    public ResponseEntity<Void> handleTripNotFound(TripNotFoundException ex) {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Void> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().build();
    }
}