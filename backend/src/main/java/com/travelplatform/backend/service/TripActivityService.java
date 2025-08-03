package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.entity.TripActivity;
import com.travelplatform.backend.exception.TripActivityNotFoundException;
import com.travelplatform.backend.repository.ActivityRepository;
import com.travelplatform.backend.repository.TripActivityRepository;
import com.travelplatform.backend.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class TripActivityService {

    @Autowired
    private TripActivityRepository tripActivityRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private ActivityRepository activityRepository;

    public TripActivity scheduleActivity(Long tripId, Long activityId, LocalDate plannedDate,
                                         LocalTime startTime, Integer durationMinutes) {

        Optional<Trip> tripOpt = tripRepository.findById(tripId);
        if (tripOpt.isEmpty()) {
            throw new RuntimeException("Trip not found with id: " + tripId);
        }

        Optional<Activity> activityOpt = activityRepository.findById(activityId);
        if (activityOpt.isEmpty()) {
            throw new RuntimeException("Activity not found with id: " + activityId);
        }

        Trip trip = tripOpt.get();
        Activity activity = activityOpt.get();

        if (tripActivityRepository.existsByTripIdAndActivityId(tripId, activityId)) {
            throw new RuntimeException("Activity is already scheduled for this trip");
        }

        if (durationMinutes == null) {
            durationMinutes = activity.getDurationMinutes();
        }

        if (tripActivityRepository.hasTimeConflict(tripId, plannedDate, startTime, durationMinutes)) {
            List<TripActivity> conflicts = tripActivityRepository.findConflictingActivities(
                    tripId, plannedDate, startTime, durationMinutes);

            StringBuilder conflictMessage = new StringBuilder("Time conflict with: ");
            for (TripActivity conflict : conflicts) {
                LocalTime conflictEnd = conflict.getStartTime().plusMinutes(conflict.getDurationMinutes());
                conflictMessage.append(conflict.getActivity().getName())
                        .append(" (")
                        .append(conflict.getPlannedDate())
                        .append(" ")
                        .append(conflict.getStartTime())
                        .append("-")
                        .append(conflictEnd)
                        .append("), ");
            }
            throw new RuntimeException(conflictMessage.toString());
        }

        TripActivity tripActivity = new TripActivity(trip, activity, plannedDate, startTime, durationMinutes);
        return tripActivityRepository.save(tripActivity);
    }

    public List<TripActivity> getScheduledActivities(Long tripId) {
        return tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(tripId);
    }

    public List<TripActivity> getActivitiesForDate(Long tripId, LocalDate date) {
        return tripActivityRepository.findByTripIdAndPlannedDateOrderByStartTimeAsc(tripId, date);
    }

    public List<TripActivity> getActivitiesInDateRange(Long tripId, LocalDate startDate, LocalDate endDate) {
        return tripActivityRepository.findByTripIdAndDateRange(tripId, startDate, endDate);
    }

    public TripActivity updateScheduledActivity(Long tripActivityId, LocalDate plannedDate,
                                                LocalTime startTime, Integer durationMinutes, String notes) {
        TripActivity tripActivity = tripActivityRepository.findById(tripActivityId)
                .orElseThrow(() -> new TripActivityNotFoundException(tripActivityId));

        // If changing time/date/duration, check for conflicts
        if (plannedDate != null || startTime != null || durationMinutes != null) {
            LocalDate newDate = plannedDate != null ? plannedDate : tripActivity.getPlannedDate();
            LocalTime newStartTime = startTime != null ? startTime : tripActivity.getStartTime();
            Integer newDuration = durationMinutes != null ? durationMinutes : tripActivity.getDurationMinutes();

            // Check conflicts using datetime logic (excluding current activity)
            List<TripActivity> conflicts = tripActivityRepository.findConflictingActivities(
                    tripActivity.getTrip().getId(), newDate, newStartTime, newDuration);

            // Remove current activity from conflicts
            conflicts.removeIf(conflict -> conflict.getId().equals(tripActivityId));

            if (!conflicts.isEmpty()) {
                StringBuilder conflictMessage = new StringBuilder("Time conflict with: ");
                for (TripActivity conflict : conflicts) {
                    LocalTime conflictEnd = conflict.getStartTime().plusMinutes(conflict.getDurationMinutes());
                    conflictMessage.append(conflict.getActivity().getName())
                            .append(" (")
                            .append(conflict.getPlannedDate())
                            .append(" ")
                            .append(conflict.getStartTime())
                            .append("-")
                            .append(conflictEnd)
                            .append("), ");
                }
                throw new RuntimeException(conflictMessage.toString());
            }

            // Update fields
            if (plannedDate != null) tripActivity.setPlannedDate(plannedDate);
            if (startTime != null) tripActivity.setStartTime(startTime);
            if (durationMinutes != null) tripActivity.setDurationMinutes(durationMinutes);
        }

        if (notes != null) tripActivity.setNotes(notes);

        return tripActivityRepository.save(tripActivity);
    }

    public void removeActivityFromTrip(Long tripActivityId) {
        if (!tripActivityRepository.existsById(tripActivityId)) {
            throw new TripActivityNotFoundException(tripActivityId);
        }
        tripActivityRepository.deleteById(tripActivityId);
    }

    public TripActivity updateActualCost(Long tripActivityId, Integer actualCost) {
        Optional<TripActivity> tripActivityOpt = tripActivityRepository.findById(tripActivityId);
        if (tripActivityOpt.isEmpty()) {
            throw new RuntimeException("Scheduled activity not found with id: " + tripActivityId);
        }

        TripActivity tripActivity = tripActivityOpt.get();
        tripActivity.setActualCost(actualCost);
        return tripActivityRepository.save(tripActivity);
    }

    public Integer calculateTotalEstimatedCost(Long tripId) {
        return tripActivityRepository.calculateTotalEstimatedCost(tripId);
    }

    public Integer calculateTotalActualCost(Long tripId) {
        return tripActivityRepository.calculateTotalActualCost(tripId);
    }

    public List<LocalDate> getTripDates(Long tripId) {
        return tripActivityRepository.findDistinctPlannedDatesByTripId(tripId);
    }

    public long getScheduledActivityCount(Long tripId) {
        return tripActivityRepository.countByTripId(tripId);
    }
}