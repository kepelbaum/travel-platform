package com.travelplatform.backend.config;

import com.travelplatform.backend.dto.ErrorResponse;
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
    public ResponseEntity<ErrorResponse> handleActivityNotFound(ActivityNotFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(TripActivityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTripActivityNotFound(TripActivityNotFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(DestinationNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDestinationNotFound(DestinationNotFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(TripNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTripNotFound(TripNotFoundException ex) {
        return ResponseEntity.status(404)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();

        // Handle specific error messages that should return 404
        if (message != null && (message.contains("not found") || message.contains("Not found"))) {
            return ResponseEntity.status(404)
                    .body(new ErrorResponse(message));
        }

        // Handle database errors and other system errors that should return 500
        if (message != null && (message.contains("Database error") ||
                message.contains("database") ||
                message.contains("connection") ||
                message.contains("SQL") ||
                message.contains("transaction"))) {
            return ResponseEntity.status(500)
                    .body(new ErrorResponse(message));
        }

        // Default to 400 for other runtime exceptions
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(message != null ? message : "An error occurred"));
    }
}