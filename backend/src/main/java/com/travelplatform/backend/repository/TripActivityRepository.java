package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.TripActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {

    // Find all activities for a trip
    List<TripActivity> findByTripIdOrderByPlannedDateAscStartTimeAsc(Long tripId);

    // Find activities for a specific trip and date
    List<TripActivity> findByTripIdAndPlannedDateOrderByStartTimeAsc(Long tripId, LocalDate date);

    // Find activities for a trip within date range
    @Query("SELECT ta FROM TripActivity ta WHERE ta.trip.id = :tripId AND " +
            "ta.plannedDate BETWEEN :startDate AND :endDate " +
            "ORDER BY ta.plannedDate ASC, ta.startTime ASC")
    List<TripActivity> findByTripIdAndDateRange(
            @Param("tripId") Long tripId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    default List<TripActivity> findConflictingActivities(Long tripId, LocalDate plannedDate, LocalTime startTime, Integer durationMinutes) {
        // Convert to datetime range
        LocalDateTime proposedStart = LocalDateTime.of(plannedDate, startTime);
        LocalDateTime proposedEnd = proposedStart.plusMinutes(durationMinutes);

        // Get all activities that might conflict (same trip, overlapping date range)
        LocalDate dayBefore = plannedDate.minusDays(1);
        LocalDate dayAfter = plannedDate.plusDays(1);
        List<TripActivity> potentialConflicts = findByTripIdAndDateRange(tripId, dayBefore, dayAfter);

        // Filter to actual conflicts
        return potentialConflicts.stream()
                .filter(activity -> {
                    LocalDateTime activityStart = LocalDateTime.of(activity.getPlannedDate(), activity.getStartTime());
                    LocalDateTime activityEnd = activityStart.plusMinutes(activity.getDurationMinutes());

                    // Check if datetime ranges overlap
                    return proposedStart.isBefore(activityEnd) && proposedEnd.isAfter(activityStart);
                })
                .toList();
    }

    default boolean hasTimeConflict(Long tripId, LocalDate plannedDate, LocalTime startTime, Integer durationMinutes) {
        return !findConflictingActivities(tripId, plannedDate, startTime, durationMinutes).isEmpty();
    }

    // Check if specific activity is already scheduled for trip
    boolean existsByTripIdAndActivityId(Long tripId, Long activityId);

    Optional<TripActivity> findByTripIdAndActivityId(Long tripId, Long activityId);

    @Query("SELECT COALESCE(SUM(CASE WHEN ta.activity IS NULL THEN ta.customEstimatedCost ELSE a.estimatedCost END), 0) " +
            "FROM TripActivity ta LEFT JOIN ta.activity a WHERE ta.trip.id = :tripId")
    Integer calculateTotalEstimatedCost(@Param("tripId") Long tripId);

    @Query("SELECT COALESCE(SUM(ta.actualCost), 0) FROM TripActivity ta WHERE ta.trip.id = :tripId AND ta.actualCost IS NOT NULL")
    Integer calculateTotalActualCost(@Param("tripId") Long tripId);

    long countByTripId(Long tripId);

    @Query("SELECT DISTINCT ta.plannedDate FROM TripActivity ta WHERE ta.trip.id = :tripId ORDER BY ta.plannedDate")
    List<LocalDate> findDistinctPlannedDatesByTripId(@Param("tripId") Long tripId);
}