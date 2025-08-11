package com.travelplatform.backend.controller;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.service.ActivityService;
import com.travelplatform.backend.service.GooglePlacesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/activities")  
public class ActivityController {

    private static final Logger logger = LoggerFactory.getLogger(ActivityController.class);

    @Autowired
    private ActivityService activityService;

    @Autowired
    private GooglePlacesService googlePlacesService;

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
            Optional<Activity> activityOpt = activityService.getActivityById(id);
            if (activityOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Activity activity = activityOpt.get();

            // If we have a placeId but missing some data, enhance with Places API
            if (activity.getPlaceId() != null && shouldEnhanceActivity(activity)) {
                try {
                    Activity enhancedActivity = googlePlacesService.getPlaceDetails(activity.getPlaceId());
                    if (enhancedActivity != null) {
                        activity = activityService.enhanceActivityWithPlacesData(activity, enhancedActivity);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to enhance activity {} with Places data", id, e);
                    // Continue with original activity data
                }
            }

            return ResponseEntity.ok(activity);
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
            @RequestParam(required = false) Double estimatedCost,
            @RequestParam(required = false) String description) {

        Activity activity = activityService.createCustomActivity(
                destinationId, name, category, durationMinutes, estimatedCost, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(activity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) Double costEstimate) {
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

    // ========== NEW GOOGLE PLACES API ENDPOINTS ==========

    /**
     * Search for activities using Google Places API and populate database
     */
    @GetMapping("/destination/{destinationId}/places-search")
    public ResponseEntity<?> searchActivitiesFromPlaces(
            @PathVariable Long destinationId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "false") boolean forceRefresh) {

        try {
            logger.info("Searching Google Places for activities in destination: {} with type: {}", destinationId, type);

            // Check if we already have cached activities and don't need to refresh
            if (!forceRefresh) {
                List<Activity> cachedActivities = activityService.getActivitiesByDestination(destinationId);
                if (!cachedActivities.isEmpty()) {
                    logger.info("Returning {} cached activities for destination: {}", cachedActivities.size(), destinationId);
                    return ResponseEntity.ok(Map.of(
                            "activities", cachedActivities,
                            "source", "cached",
                            "count", cachedActivities.size()
                    ));
                }
            }

            // Fetch from Google Places API
            List<Activity> activities = googlePlacesService.searchActivitiesForDestination(destinationId, type);

            // Save new activities to database (avoid duplicates by placeId)
            List<Activity> savedActivities = activityService.saveActivitiesFromPlaces(activities, destinationId);

            logger.info("Found and saved {} activities for destination: {}", savedActivities.size(), destinationId);
            return ResponseEntity.ok(Map.of(
                    "activities", savedActivities,
                    "source", "google_places",
                    "count", savedActivities.size()
            ));

        } catch (RuntimeException e) {
            logger.error("Error searching for activities in destination: {}", destinationId, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error searching for activities in destination: {}", destinationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * Get activity categories available in the system
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getActivityCategories() {
        try {
            List<String> categories = activityService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            logger.error("Error getting activity categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Refresh a specific activity's data from Google Places
     */
    @PostMapping("/{id}/refresh-places-data")
    public ResponseEntity<?> refreshActivityFromPlaces(@PathVariable Long id) {
        try {
            Optional<Activity> activityOpt = activityService.getActivityById(id);
            if (activityOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Activity activity = activityOpt.get();
            if (activity.getPlaceId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Activity has no Google Places ID"));
            }

            Activity enhancedActivity = googlePlacesService.getPlaceDetails(activity.getPlaceId());
            if (enhancedActivity != null) {
                activity = activityService.enhanceActivityWithPlacesData(activity, enhancedActivity);
                return ResponseEntity.ok(activity);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not fetch Places data"));
            }

        } catch (Exception e) {
            logger.error("Error refreshing activity {} from Places", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * Health check endpoint to test Google Places API connection
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        try {
            Map<String, String> health = Map.of(
                    "status", "healthy",
                    "google_places_api", "configured"
            );
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            logger.error("Health check failed", e);
            Map<String, String> health = Map.of(
                    "status", "unhealthy",
                    "error", e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(health);
        }
    }

    /**
     * Helper method to determine if activity needs enhancement from Places API
     */
    private boolean shouldEnhanceActivity(Activity activity) {
        return activity.getPhotoUrl() == null ||
                activity.getRating() == null ||
                activity.getAddress() == null ||
                activity.getOpeningHours() == null;
    }

    /**
     * Force refresh activities from Google Places API (bypasses cache)
     */
    @PostMapping("/destination/{destinationId}/refresh")
    public ResponseEntity<Map<String, Object>> forceRefreshActivities(@PathVariable Long destinationId) {
        try {
            logger.info("Force refreshing activities for destination: {}", destinationId);

            List<Activity> activities = activityService.forceRefreshActivities(destinationId);

            return ResponseEntity.ok(Map.of(
                    "activities", activities,
                    "count", activities.size(),
                    "source", "google_places_refreshed",
                    "message", "Cache cleared and refreshed from Google Places API"
            ));
        } catch (Exception e) {
            logger.error("Error force refreshing activities for destination: {}", destinationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to refresh activities"));
        }
    }

    /**
     * Get cache statistics for monitoring and debugging
     */
    @GetMapping("/destination/{destinationId}/cache-stats")
    public ResponseEntity<ActivityService.CacheStats> getCacheStats(@PathVariable Long destinationId) {
        try {
            ActivityService.CacheStats stats = activityService.getCacheStats(destinationId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error getting cache stats for destination: {}", destinationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public static class CreateCustomActivityRequest {
        private String name;
        private String category;
        private Integer durationMinutes;
        private Double costEstimate;
        private String description;
    }

    @GetMapping("/destination/{destinationId}/smart")
    public ResponseEntity<Map<String, Object>> getActivitiesWithSmartCaching(@PathVariable Long destinationId) {
        try {
            List<Activity> activities = activityService.getActivitiesByDestination(destinationId);

            // Get cache stats for response metadata
            ActivityService.CacheStats stats = activityService.getCacheStats(destinationId);

            return ResponseEntity.ok(Map.of(
                    "activities", activities,
                    "count", activities.size(),
                    "source", stats.isCacheStale() ? "google_places_auto_refreshed" : "database_cached",
                    "cacheStats", Map.of(
                            "totalActivities", stats.getTotalActivities(),
                            "lastRefresh", stats.getLastRefresh(),
                            "isCacheStale", stats.isCacheStale(),
                            "cacheTtlDays", stats.getCacheTtlDays()
                    )
            ));
        } catch (Exception e) {
            logger.error("Error fetching smart cached activities for destination: {}", destinationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}