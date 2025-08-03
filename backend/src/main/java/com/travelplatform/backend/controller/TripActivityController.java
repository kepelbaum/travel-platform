package com.travelplatform.backend.controller;

import com.travelplatform.backend.dto.TripCostSummary;
import com.travelplatform.backend.entity.TripActivity;
import com.travelplatform.backend.service.TripActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trip-activities")
public class TripActivityController {

    @Autowired
    private TripActivityService tripActivityService;

    @PostMapping("/schedule")
    public ResponseEntity<?> scheduleActivity(
            @RequestParam Long tripId,
            @RequestParam Long activityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate plannedDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam(required = false) Integer durationMinutes) {
        try {
            TripActivity tripActivity = tripActivityService.scheduleActivity(
                    tripId, activityId, plannedDate, startTime, durationMinutes);
            return ResponseEntity.status(HttpStatus.CREATED).body(tripActivity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<TripActivity>> getScheduledActivities(@PathVariable Long tripId) {
        try {
            List<TripActivity> activities = tripActivityService.getScheduledActivities(tripId);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/trip/{tripId}/date/{date}")
    public ResponseEntity<List<TripActivity>> getActivitiesForDate(
            @PathVariable Long tripId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<TripActivity> activities = tripActivityService.getActivitiesForDate(tripId, date);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/trip/{tripId}/date-range")
    public ResponseEntity<List<TripActivity>> getActivitiesInDateRange(
            @PathVariable Long tripId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            List<TripActivity> activities = tripActivityService.getActivitiesInDateRange(tripId, startDate, endDate);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{tripActivityId}")
    public ResponseEntity<TripActivity> updateScheduledActivity(
            @PathVariable Long tripActivityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate plannedDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) String notes) {
        TripActivity tripActivity = tripActivityService.updateScheduledActivity(
                tripActivityId, plannedDate, startTime, durationMinutes, notes);
        return ResponseEntity.ok(tripActivity);
    }

    @DeleteMapping("/{tripActivityId}")
    public ResponseEntity<Void> removeActivityFromTrip(@PathVariable Long tripActivityId) {
        tripActivityService.removeActivityFromTrip(tripActivityId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{tripActivityId}/actual-cost")
    public ResponseEntity<TripActivity> updateActualCost(
            @PathVariable Long tripActivityId,
            @RequestParam Integer actualCost) {
        TripActivity tripActivity = tripActivityService.updateActualCost(tripActivityId, actualCost);
        return ResponseEntity.ok(tripActivity);
    }

    @GetMapping("/trip/{tripId}/costs")
    public ResponseEntity<TripCostSummary> getTripCosts(@PathVariable Long tripId) {
        try {
            Integer estimatedCost = tripActivityService.calculateTotalEstimatedCost(tripId);
            Integer actualCost = tripActivityService.calculateTotalActualCost(tripId);
            long activityCount = tripActivityService.getScheduledActivityCount(tripId);

            TripCostSummary summary = new TripCostSummary(estimatedCost, actualCost, activityCount);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/trip/{tripId}/dates")
    public ResponseEntity<List<LocalDate>> getTripDates(@PathVariable Long tripId) {
        try {
            List<LocalDate> dates = tripActivityService.getTripDates(tripId);
            return ResponseEntity.ok(dates);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}