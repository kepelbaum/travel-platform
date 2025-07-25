package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUser(User user);
    List<Trip> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Trip> findByStatus(Trip.TripStatus status);
    List<Trip> findByStartDateBetween(LocalDate startDate, LocalDate endDate);
    List<Trip> findByUserAndStatus(User user, Trip.TripStatus status);
}

