package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
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
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

        if (plannedDate.isBefore(trip.getStartDate()) || plannedDate.isAfter(trip.getEndDate())) {
            throw new RuntimeException(String.format(
                    "Activity date %s is outside trip dates (%s to %s)",
                    plannedDate, trip.getStartDate(), trip.getEndDate()));
        }

        // Determine timezone for this activity
        String activityTimezone = determineActivityTimezone(activity, trip);

        // Handle duration
        if (durationMinutes == null) {
            durationMinutes = activity.getDurationMinutes();
            if (durationMinutes == null) {
                durationMinutes = 60; // Default to 1 hour
            }
        }

        // Check for timezone-aware conflicts
        if (durationMinutes > 0) {
            List<TripActivity> conflicts = findTimezoneAwareConflicts(
                    tripId, plannedDate, startTime, durationMinutes, activityTimezone, null);

            if (!conflicts.isEmpty()) {
                throw new RuntimeException(buildConflictMessage(conflicts));
            }
        }

        TripActivity tripActivity = new TripActivity(trip, activity, plannedDate, startTime, durationMinutes, activityTimezone);
        return tripActivityRepository.save(tripActivity);
    }

    public TripActivity updateScheduledActivity(Long tripActivityId, LocalDate plannedDate,
                                                LocalTime startTime, Integer durationMinutes, String notes,
                                                String customName, String customDescription, Double customEstimatedCost) {
        TripActivity tripActivity = tripActivityRepository.findById(tripActivityId)
                .orElseThrow(() -> new TripActivityNotFoundException(tripActivityId));

        // If changing time/date/duration, check for conflicts
        if (plannedDate != null || startTime != null || durationMinutes != null) {
            LocalDate newDate = plannedDate != null ? plannedDate : tripActivity.getPlannedDate();
            LocalTime newStartTime = startTime != null ? startTime : tripActivity.getStartTime();
            Integer newDuration = durationMinutes != null ? durationMinutes : tripActivity.getDurationMinutes();

            // Ensure valid duration
            if (newDuration == null) {
                newDuration = tripActivity.getActivity() != null ?
                        tripActivity.getActivity().getDurationMinutes() : 60;
                if (newDuration == null) newDuration = 60;
            }

            // Use existing timezone or determine new one
            String timezone = tripActivity.getTimezone();
            if (timezone == null) {
                timezone = determineActivityTimezone(tripActivity.getActivity(), tripActivity.getTrip());
                tripActivity.setTimezone(timezone);
            }

            // Check timezone-aware conflicts (excluding current activity)
            if (newDuration > 0 && newStartTime != null) {
                List<TripActivity> conflicts = findTimezoneAwareConflicts(
                        tripActivity.getTrip().getId(), newDate, newStartTime, newDuration, timezone, tripActivityId);

                if (!conflicts.isEmpty()) {
                    throw new RuntimeException(buildConflictMessage(conflicts));
                }
            }

            // Update fields
            if (plannedDate != null) tripActivity.setPlannedDate(plannedDate);
            if (startTime != null) tripActivity.setStartTime(startTime);
            if (durationMinutes != null) tripActivity.setDurationMinutes(durationMinutes);
        }

        // Update custom fields and notes
        if (tripActivity.getActivity() == null) {
            if (customName != null) tripActivity.setCustomName(customName);
            if (customDescription != null) tripActivity.setCustomDescription(customDescription);
            if (customEstimatedCost != null) tripActivity.setCustomEstimatedCost(customEstimatedCost);
        }
        if (notes != null) tripActivity.setNotes(notes);

        return tripActivityRepository.save(tripActivity);
    }

    // Helper: Determine appropriate timezone for an activity
    private String determineActivityTimezone(Activity activity, Trip trip) {
        if (activity != null && activity.getDestination() != null && activity.getDestination().getTimezone() != null) {
            return activity.getDestination().getTimezone();
        }

        // Fallback: if trip has destinations, use the first one's timezone
        if (trip.getDestinations() != null && !trip.getDestinations().isEmpty()) {
            for (Destination dest : trip.getDestinations()) {
                if (dest.getTimezone() != null) {
                    return dest.getTimezone();
                }
            }
        }

        // Ultimate fallback: UTC
        return "UTC";
    }

    // Helper: Find conflicts across different timezones
    private List<TripActivity> findTimezoneAwareConflicts(Long tripId, LocalDate plannedDate,
                                                          LocalTime startTime, Integer durationMinutes,
                                                          String timezone, Long excludeActivityId) {

        // Get all activities for the trip
        List<TripActivity> allActivities = tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(tripId);

        // Convert proposed activity to ZonedDateTime
        ZonedDateTime proposedStart = ZonedDateTime.of(plannedDate, startTime, ZoneId.of(timezone));
        ZonedDateTime proposedEnd = proposedStart.plusMinutes(durationMinutes);

        return allActivities.stream()
                .filter(existing -> {
                    // Skip if this is the activity being updated
                    if (excludeActivityId != null && existing.getId().equals(excludeActivityId)) {
                        return false;
                    }

                    // Skip if missing required data
                    if (existing.getPlannedDate() == null || existing.getStartTime() == null) {
                        return false;
                    }

                    // Get timezone for existing activity
                    String existingTimezone = existing.getTimezone();
                    if (existingTimezone == null) {
                        existingTimezone = determineActivityTimezone(existing.getActivity(), existing.getTrip());
                    }

                    // Get duration for existing activity
                    Integer existingDuration = existing.getDurationMinutes();
                    if (existingDuration == null) {
                        existingDuration = existing.getActivity() != null ?
                                existing.getActivity().getDurationMinutes() : 60;
                        if (existingDuration == null) existingDuration = 60;
                    }

                    try {
                        // Convert existing activity to ZonedDateTime
                        ZonedDateTime existingStart = ZonedDateTime.of(
                                existing.getPlannedDate(), existing.getStartTime(), ZoneId.of(existingTimezone));
                        ZonedDateTime existingEnd = existingStart.plusMinutes(existingDuration);

                        // Convert both to UTC for comparison
                        ZonedDateTime proposedStartUTC = proposedStart.withZoneSameInstant(ZoneId.of("UTC"));
                        ZonedDateTime proposedEndUTC = proposedEnd.withZoneSameInstant(ZoneId.of("UTC"));
                        ZonedDateTime existingStartUTC = existingStart.withZoneSameInstant(ZoneId.of("UTC"));
                        ZonedDateTime existingEndUTC = existingEnd.withZoneSameInstant(ZoneId.of("UTC"));

                        // Check for overlap in UTC
                        return proposedStartUTC.isBefore(existingEndUTC) && proposedEndUTC.isAfter(existingStartUTC);

                    } catch (Exception e) {
                        // If timezone conversion fails, log and skip
                        System.err.println("Timezone conversion error for activity " + existing.getId() + ": " + e.getMessage());
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }

    // Helper: Build conflict error message with timezone info
    private String buildConflictMessage(List<TripActivity> conflicts) {
        StringBuilder message = new StringBuilder("Time conflict with: ");

        for (TripActivity conflict : conflicts) {
            String conflictName = conflict.getActivity() != null ?
                    conflict.getActivity().getName() : conflict.getCustomName();

            Integer conflictDuration = conflict.getDurationMinutes();
            if (conflictDuration == null) conflictDuration = 60;

            // Show times in the conflict's local timezone
            ZonedDateTime conflictStart = conflict.getZonedStartDateTime();
            ZonedDateTime conflictEnd = conflict.getZonedEndDateTime();

            if (conflictStart != null && conflictEnd != null) {
                message.append(conflictName)
                        .append(" (")
                        .append(conflictStart.toLocalDate())
                        .append(" ")
                        .append(conflictStart.toLocalTime())
                        .append("-")
                        .append(conflictEnd.toLocalTime())
                        .append(" ")
                        .append(conflictStart.getZone().getId())
                        .append("), ");
            } else {
                message.append(conflictName).append(" (time data incomplete), ");
            }
        }

        return message.toString();
    }
        
    public TripActivity scheduleCustomActivity(Long tripId, String customName, String customCategory,
                                               String customDescription, Double customEstimatedCost,
                                               LocalDate plannedDate, LocalTime startTime, Integer durationMinutes,
                                               String timezone) {

        Optional<Trip> tripOpt = tripRepository.findById(tripId);
        if (tripOpt.isEmpty()) {
            throw new RuntimeException("Trip not found with id: " + tripId);
        }

        Trip trip = tripOpt.get();

        if (durationMinutes == null) {
            durationMinutes = 60;
        }

        if (timezone == null) {
            timezone = determineDefaultTimezone(trip);
        }

        // Check for timezone-aware conflicts
        if (durationMinutes > 0) {
            List<TripActivity> conflicts = findTimezoneAwareConflicts(
                    tripId, plannedDate, startTime, durationMinutes, timezone, null);

            if (!conflicts.isEmpty()) {
                throw new RuntimeException(buildConflictMessage(conflicts));
            }
        }

        // Create custom TripActivity
        TripActivity tripActivity = new TripActivity();
        tripActivity.setTrip(trip);
        tripActivity.setActivity(null);
        tripActivity.setCustomName(customName);
        tripActivity.setCustomCategory(customCategory);
        tripActivity.setCustomDescription(customDescription);
        tripActivity.setCustomEstimatedCost(customEstimatedCost);
        tripActivity.setPlannedDate(plannedDate);
        tripActivity.setStartTime(startTime);
        tripActivity.setDurationMinutes(durationMinutes);
        tripActivity.setTimezone(timezone);

        return tripActivityRepository.save(tripActivity);
    }

    private String determineDefaultTimezone(Trip trip) {
        if (trip.getDestinations() != null && !trip.getDestinations().isEmpty()) {
            for (Destination dest : trip.getDestinations()) {
                if (dest.getTimezone() != null) {
                    return dest.getTimezone();
                }
            }
        }
        return "UTC";
    }

    public List<TripActivity> getScheduledActivities(Long tripId) {
        return tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(tripId);
    }

    public List<TripActivity> getActivitiesForDate(Long tripId, LocalDate date) {
        return tripActivityRepository.findByTripIdAndPlannedDateOrderByStartTimeAsc(tripId, date);
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