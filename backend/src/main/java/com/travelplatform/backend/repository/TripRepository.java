package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserIdOrderByCreatedAtDesc(Long userId);
}

