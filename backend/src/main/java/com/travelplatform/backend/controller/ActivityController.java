package com.travelplatform.backend.controller;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleActivityNotFound(RuntimeException ex) {
        if (ex.getMessage().contains("Activity not found")) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
    }

    @GetMapping("/destination/{destinationId}")
    public ResponseEntity<List<Activity>> getActivitiesByDestination(@PathVariable Long destinationId) {
        try {
            List<Activity> activities = activityService.getActivitiesByDestination(destinationId);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/destination/{destinationId}/category/{category}")
    public ResponseEntity<List<Activity>> getActivitiesByDestinationAndCategory(
            @PathVariable Long destinationId,
            @PathVariable String category) {
        try {
            List<Activity> activities = activityService.getActivitiesByDestinationAndCategory(destinationId, category);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivityById(@PathVariable Long id) {
        try {
            Optional<Activity> activity = activityService.getActivityById(id);
            return activity.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/destination/{destinationId}/search")
    public ResponseEntity<List<Activity>> searchActivities(
            @PathVariable Long destinationId,
            @RequestParam String query) {
        try {
            List<Activity> activities = activityService.searchActivities(destinationId, query);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/destination/{destinationId}/top-rated")
    public ResponseEntity<List<Activity>> getTopRatedActivities(@PathVariable Long destinationId) {
        try {
            List<Activity> activities = activityService.getTopRatedActivities(destinationId);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/destination/{destinationId}/cost-range")
    public ResponseEntity<List<Activity>> getActivitiesByCostRange(
            @PathVariable Long destinationId,
            @RequestParam(required = false) Integer minCost,
            @RequestParam(required = false) Integer maxCost) {
        try {
            List<Activity> activities = activityService.getActivitiesByCostRange(destinationId, minCost, maxCost);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/destination/{destinationId}/custom")
    public ResponseEntity<Activity> createCustomActivity(
            @PathVariable Long destinationId,
            @RequestParam String name,
            @RequestParam String category,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) Integer costEstimate,
            @RequestParam(required = false) String description) {
        try {
            Activity activity = activityService.createCustomActivity(
                    destinationId, name, category, durationMinutes, costEstimate, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(activity);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) Integer costEstimate) {
        try {
            Activity activity = activityService.updateActivity(
                    id, name, description, category, durationMinutes, costEstimate);
            return ResponseEntity.ok(activity);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        try {
            activityService.deleteActivity(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get activity count for destination
    @GetMapping("/destination/{destinationId}/count")
    public ResponseEntity<Long> getActivityCount(@PathVariable Long destinationId) {
        try {
            long count = activityService.getActivityCount(destinationId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public static class CreateCustomActivityRequest {
        private String name;
        private String category;
        private Integer durationMinutes;
        private Integer costEstimate;
        private String description;
    }
}