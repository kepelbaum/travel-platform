package com.travelplatform.backend.controller;

import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.service.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @GetMapping
    public ResponseEntity<List<Trip>> getUserTrips(@RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        List<Trip> trips = tripService.getUserTrips(userId);
        return ResponseEntity.ok(trips);
    }

    @PostMapping
    public ResponseEntity<Trip> createTrip(@Valid @RequestBody Trip trip, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        Trip createdTrip = tripService.createTrip(trip, userId);
        return ResponseEntity.ok(createdTrip);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@PathVariable Long id, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        try {
            Trip trip = tripService.getTripById(id, userId);
            return ResponseEntity.ok(trip);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(@PathVariable Long id, @Valid @RequestBody Trip trip, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        try {
            Trip updatedTrip = tripService.updateTrip(id, trip, userId);
            return ResponseEntity.ok(updatedTrip);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        try {
            tripService.deleteTrip(id, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
