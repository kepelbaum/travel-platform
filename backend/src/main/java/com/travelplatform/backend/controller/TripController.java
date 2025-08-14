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
    public ResponseEntity<List<Trip>> getUserTrips() {
        List<Trip> trips = tripService.getUserTrips();
        return ResponseEntity.ok(trips);
    }

    @PostMapping
    public ResponseEntity<Trip> createTrip(@Valid @RequestBody Trip trip) {
        Trip createdTrip = tripService.createTrip(trip);
        return ResponseEntity.ok(createdTrip);
    }

    @PostMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<Trip> addDestinationToTrip(
            @PathVariable Long tripId,
            @PathVariable Long destinationId) {
        Trip updatedTrip = tripService.addDestinationToTrip(tripId, destinationId);
        return ResponseEntity.ok(updatedTrip);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTripById(@PathVariable Long id) {
        Trip trip = tripService.getTripById(id) ;
        return ResponseEntity.ok(trip);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trip> updateTrip(@PathVariable Long id, @Valid @RequestBody Trip trip) {
        Trip updatedTrip = tripService.updateTrip(id, trip);
        return ResponseEntity.ok(updatedTrip);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{tripId}/destinations/{destinationId}")
    public ResponseEntity<Trip> removeDestinationFromTrip(
            @PathVariable Long tripId,
            @PathVariable Long destinationId) {
        Trip updatedTrip = tripService.removeDestinationFromTrip(tripId, destinationId);
        return ResponseEntity.ok(updatedTrip);
    }
}
