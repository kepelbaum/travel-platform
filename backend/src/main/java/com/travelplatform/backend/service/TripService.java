package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.entity.User;
import com.travelplatform.backend.exception.DestinationNotFoundException;
import com.travelplatform.backend.exception.TripNotFoundException;
import com.travelplatform.backend.repository.DestinationRepository;
import com.travelplatform.backend.repository.TripRepository;
import com.travelplatform.backend.repository.TripActivityRepository;
import com.travelplatform.backend.util.UserSecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserSecurityUtil userSecurityUtil;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TripActivityRepository tripActivityRepository;

    public List<Trip> getUserTrips() {
        Long currentUserId = userSecurityUtil.getCurrentUserId();
        return tripRepository.findByUserIdOrderByCreatedAtDesc(currentUserId);
    }

    public Trip createTrip(Trip trip) {
        User currentUser = userSecurityUtil.getCurrentUser();
        trip.setUser(currentUser);
        return tripRepository.save(trip);
    }

    public Trip getTripById(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new TripNotFoundException(tripId));

        userSecurityUtil.validateTripOwnership(tripId, trip.getUser().getId());

        return trip;
    }

    public Trip updateTrip(Long tripId, Trip updatedTrip) {
        Trip trip = getTripById(tripId);

        trip.setName(updatedTrip.getName());
        trip.setStartDate(updatedTrip.getStartDate());
        trip.setEndDate(updatedTrip.getEndDate());
        trip.setBudget(updatedTrip.getBudget());
        trip.setStatus(updatedTrip.getStatus());

        return tripRepository.save(trip);
    }

    @Transactional
    public void deleteTrip(Long tripId) {
        Trip trip = getTripById(tripId);
        tripRepository.delete(trip);
    }

    public Trip addDestinationToTrip(Long tripId, Long destinationId) {
        Trip trip = getTripById(tripId);
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new DestinationNotFoundException(destinationId));

        trip.getDestinations().add(destination);
        return tripRepository.save(trip);
    }

    @Transactional
    public Trip removeDestinationFromTrip(Long tripId, Long destinationId) {
        Trip trip = getTripById(tripId);

        // Verify the destination is actually part of this trip
        boolean destinationExists = trip.getDestinations().stream()
                .anyMatch(d -> d.getId().equals(destinationId));

        if (!destinationExists) {
            throw new RuntimeException("Destination not found in this trip");
        }

        // Delete all trip activities for this destination first
        tripActivityRepository.deleteByTripIdAndActivityDestinationId(tripId, destinationId);

        // Remove the destination from the trip's destination list
        trip.getDestinations().removeIf(dest -> dest.getId().equals(destinationId));

        // Save the updated trip
        return tripRepository.save(trip);
    }
}