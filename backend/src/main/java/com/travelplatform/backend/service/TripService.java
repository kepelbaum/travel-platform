package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.entity.User;
import com.travelplatform.backend.repository.DestinationRepository;
import com.travelplatform.backend.repository.TripRepository;
import com.travelplatform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    public List<Trip> getUserTrips(Long userId) {
        return tripRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Trip createTrip(Trip trip, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        trip.setUser(user);
        return tripRepository.save(trip);
    }

    public Trip getTripById(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (!trip.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return trip;
    }

    public Trip updateTrip(Long tripId, Trip updatedTrip, Long userId) {
        Trip trip = getTripById(tripId, userId);

        trip.setName(updatedTrip.getName());
        trip.setStartDate(updatedTrip.getStartDate());
        trip.setEndDate(updatedTrip.getEndDate());
        trip.setBudget(updatedTrip.getBudget());
        trip.setStatus(updatedTrip.getStatus());

        return tripRepository.save(trip);
    }

    public void deleteTrip(Long tripId, Long userId) {
        Trip trip = getTripById(tripId, userId);
        tripRepository.delete(trip);
    }

    public Trip addDestinationToTrip(Long tripId, Long destinationId, Long userId) {
        Trip trip = getTripById(tripId, userId); // Reuse existing method
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found"));

        trip.getDestinations().add(destination);
        return tripRepository.save(trip);
    }

    public Trip removeDestinationFromTrip(Long tripId, Long destinationId, Long userId) {
        Trip trip = getTripById(tripId, userId); // Reuse existing method
        trip.getDestinations().removeIf(dest -> dest.getId().equals(destinationId));
        return tripRepository.save(trip);
    }
}
