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

    @PostMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<Trip> addDestinationToTrip(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @RequestParam Long userId) {
        Trip updatedTrip = tripService.addDestinationToTrip(tripId, destinationId, userId);
        return ResponseEntity.ok(updatedTrip);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@PathVariable Long id, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        Trip trip = tripService.getTripById(id, userId);
        return ResponseEntity.ok(trip);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(@PathVariable Long id, @Valid @RequestBody Trip trip, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        Trip updatedTrip = tripService.updateTrip(id, trip, userId);
        return ResponseEntity.ok(updatedTrip);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id, @RequestParam Long userId) {
        // TODO: Extract userId from JWT token instead of RequestParam
        tripService.deleteTrip(id, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<Trip> removeDestinationFromTrip(
            @PathVariable Long tripId,
            @PathVariable Long destinationId,
            @RequestParam Long userId) {
        Trip updatedTrip = tripService.removeDestinationFromTrip(tripId, destinationId, userId);
        return ResponseEntity.ok(updatedTrip);
    }
}
