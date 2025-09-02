package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.TripActivity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {

    // Find all activities for a trip
    @Query("SELECT ta FROM TripActivity ta LEFT JOIN FETCH ta.activity WHERE ta.trip.id = :tripId ORDER BY ta.plannedDate ASC, ta.startTime ASC")
    List<TripActivity> findByTripIdOrderByPlannedDateAscStartTimeAsc(@Param("tripId") Long tripId);

    // Find activities for a specific trip and date
    @Query("SELECT ta FROM TripActivity ta LEFT JOIN FETCH ta.activity WHERE ta.trip.id = :tripId AND ta.plannedDate = :date ORDER BY ta.startTime ASC")
    List<TripActivity> findByTripIdAndPlannedDateOrderByStartTimeAsc(@Param("tripId") Long tripId, @Param("date") LocalDate date);

    // Find activities for a trip within date range
    @Query("SELECT ta FROM TripActivity ta WHERE ta.trip.id = :tripId AND " +
            "ta.plannedDate BETWEEN :startDate AND :endDate " +
            "ORDER BY ta.plannedDate ASC, ta.startTime ASC")
    List<TripActivity> findByTripIdAndDateRange(
            @Param("tripId") Long tripId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Fixed conflict detection - same date only, with null safety
    default List<TripActivity> findConflictingActivities(Long tripId, LocalDate plannedDate, LocalTime startTime, Integer durationMinutes) {
        // Get activities only on the same date to avoid false positives
        List<TripActivity> sameDateActivities = findByTripIdAndPlannedDateOrderByStartTimeAsc(tripId, plannedDate);

        // Calculate proposed end time
        LocalTime proposedEndTime = startTime.plusMinutes(durationMinutes);

        // Filter to actual time conflicts
        return sameDateActivities.stream()
                .filter(activity -> {
                    // Skip activities with null times
                    if (activity.getStartTime() == null) return false;

                    // Handle null duration gracefully
                    Integer activityDuration = activity.getDurationMinutes();
                    if (activityDuration == null) {
                        // Try to get from activity definition
                        if (activity.getActivity() != null && activity.getActivity().getDurationMinutes() != null) {
                            activityDuration = activity.getActivity().getDurationMinutes();
                        } else {
                            activityDuration = 60; // Default 1 hour
                        }
                    }

                    LocalTime activityStart = activity.getStartTime();
                    LocalTime activityEnd = activityStart.plusMinutes(activityDuration);

                    // Check if time ranges overlap on the same date
                    return startTime.isBefore(activityEnd) && proposedEndTime.isAfter(activityStart);
                })
                .toList();
    }

    default boolean hasTimeConflict(Long tripId, LocalDate plannedDate, LocalTime startTime, Integer durationMinutes) {
        // Only check conflicts if we have valid time data
        if (startTime == null || durationMinutes == null || durationMinutes <= 0) {
            return false;
        }
        return !findConflictingActivities(tripId, plannedDate, startTime, durationMinutes).isEmpty();
    }

    // Check if specific activity is already scheduled for trip
    boolean existsByTripIdAndActivityId(Long tripId, Long activityId);

    @Query("SELECT COALESCE(SUM(CASE WHEN ta.activity IS NULL THEN ta.customEstimatedCost ELSE a.estimatedCost END), 0) " +
            "FROM TripActivity ta LEFT JOIN ta.activity a WHERE ta.trip.id = :tripId")
    Integer calculateTotalEstimatedCost(@Param("tripId") Long tripId);

    @Query("SELECT COALESCE(SUM(ta.actualCost), 0) FROM TripActivity ta WHERE ta.trip.id = :tripId AND ta.actualCost IS NOT NULL")
    Integer calculateTotalActualCost(@Param("tripId") Long tripId);

    long countByTripId(Long tripId);

    @Query("SELECT DISTINCT ta.plannedDate FROM TripActivity ta WHERE ta.trip.id = :tripId ORDER BY ta.plannedDate")
    List<LocalDate> findDistinctPlannedDatesByTripId(@Param("tripId") Long tripId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TripActivity ta WHERE ta.trip.id = :tripId AND ta.activity.destination.id = :destinationId")
    void deleteByTripIdAndActivityDestinationId(@Param("tripId") Long tripId, @Param("destinationId") Long destinationId);
}