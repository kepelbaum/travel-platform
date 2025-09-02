package com.travelplatform.backend.controller;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.exception.ActivityMissingPlaceIdException;
import com.travelplatform.backend.exception.GooglePlacesApiException;
import com.travelplatform.backend.service.ActivityService;
import com.travelplatform.backend.service.GooglePlacesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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

    // Main endpoint - returns ALL activities for frontend pagination
    @GetMapping("/destination/{destinationId}")
    public ResponseEntity<Map<String, Object>> getActivitiesByDestination(@PathVariable Long destinationId) {
        List<Activity> allActivities = activityService.getAllActivitiesByDestination(destinationId);
        ActivityService.CacheStats stats = activityService.getCacheStats(destinationId);

        return ResponseEntity.ok(Map.of(
                "activities", allActivities,
                "count", allActivities.size(),
                "source", stats.isCacheStale() ? "google_places_auto_refreshed" : "database_cached"
        ));
    }

    // Smart endpoint with cache stats
    @GetMapping("/destination/{destinationId}/smart")
    public ResponseEntity<Map<String, Object>> getActivitiesWithSmartCaching(@PathVariable Long destinationId) {
        List<Activity> allActivities = activityService.getAllActivitiesByDestination(destinationId);
        ActivityService.CacheStats stats = activityService.getCacheStats(destinationId);

        return ResponseEntity.ok(Map.of(
                "activities", allActivities,
                "count", allActivities.size(),
                "source", stats.isCacheStale() ? "google_places_auto_refreshed" : "database_cached",
                "cacheStats", Map.of(
                        "totalActivities", stats.getTotalActivities(),
                        "lastRefresh", stats.getLastRefresh(),
                        "isCacheStale", stats.isCacheStale(),
                        "cacheTtlDays", stats.getCacheTtlDays()
                )
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivityById(@PathVariable Long id) {
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
    }

    @GetMapping("/destination/{destinationId}/top-rated")
    public ResponseEntity<List<Activity>> getTopRatedActivities(@PathVariable Long destinationId) {
        List<Activity> activities = activityService.getTopRatedActivities(destinationId);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/destination/{destinationId}/cost-range")
    public ResponseEntity<List<Activity>> getActivitiesByCostRange(
            @PathVariable Long destinationId,
            @RequestParam(required = false) Integer minCost,
            @RequestParam(required = false) Integer maxCost) {
        List<Activity> activities = activityService.getActivitiesByCostRange(destinationId, minCost, maxCost);
        return ResponseEntity.ok(activities);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) Double costEstimate) {
        Activity activity = activityService.updateActivity(
                id, name, description, category, durationMinutes, costEstimate);
        return ResponseEntity.ok(activity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/destination/{destinationId}/count")
    public ResponseEntity<Long> getActivityCount(@PathVariable Long destinationId) {
        long count = activityService.getActivityCount(destinationId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/destination/{destinationId}/places-search")
    public ResponseEntity<Map<String, Object>> searchActivitiesFromPlaces(
            @PathVariable Long destinationId,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "false") boolean forceRefresh) {

        logger.info("Searching Google Places for activities in destination: {} with type: {}", destinationId, type);

        // Check if we already have cached activities and don't need to refresh
        if (!forceRefresh) {
            List<Activity> cachedActivities = activityService.getAllActivitiesByDestination(destinationId);
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
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getActivityCategories() {
        List<String> categories = activityService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/{id}/refresh-places-data")
    public ResponseEntity<Activity> refreshActivityFromPlaces(@PathVariable Long id) {
        Optional<Activity> activityOpt = activityService.getActivityById(id);
        if (activityOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Activity activity = activityOpt.get();
        if (activity.getPlaceId() == null) {
            throw new ActivityMissingPlaceIdException("Activity has no Google Places ID");
        }

        Activity enhancedActivity = googlePlacesService.getPlaceDetails(activity.getPlaceId());
        if (enhancedActivity != null) {
            activity = activityService.enhanceActivityWithPlacesData(activity, enhancedActivity);
            return ResponseEntity.ok(activity);
        } else {
            throw new GooglePlacesApiException("Could not fetch Places data");
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> health = Map.of(
                "status", "healthy",
                "google_places_api", "configured"
        );
        return ResponseEntity.ok(health);
    }

    @PostMapping("/destination/{destinationId}/refresh")
    public ResponseEntity<Map<String, Object>> forceRefreshActivities(@PathVariable Long destinationId) {
        List<Activity> activities = activityService.forceRefreshActivities(destinationId);
        return ResponseEntity.ok(Map.of(
                "activities", activities,
                "count", activities.size(),
                "source", "google_places_refreshed",
                "message", "Cache cleared and refreshed from Google Places API"
        ));
    }

    @GetMapping("/destination/{destinationId}/cache-stats")
    public ResponseEntity<ActivityService.CacheStats> getCacheStats(@PathVariable Long destinationId) {
        ActivityService.CacheStats stats = activityService.getCacheStats(destinationId);
        return ResponseEntity.ok(stats);
    }

    private boolean shouldEnhanceActivity(Activity activity) {
        return activity.getPhotoUrl() == null ||
                activity.getRating() == null ||
                activity.getAddress() == null ||
                activity.getOpeningHours() == null;
    }

    @GetMapping("/photo/{photoReference}")
    public ResponseEntity<byte[]> getPhoto(@PathVariable String photoReference) {
        try {
            String photoUrl = googlePlacesService.buildPhotoUrl(photoReference);
            RestTemplate restTemplate = new RestTemplate();
            byte[] imageBytes = restTemplate.getForObject(photoUrl, byte[].class);

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(imageBytes);
        } catch (Exception e) {
            logger.warn("Failed to fetch photo for reference: {}", photoReference, e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/placeDetails/{placeId}")
    public ResponseEntity<Activity> getPlaceDetailsEndpoint(@PathVariable String placeId) {
        Activity activity = googlePlacesService.getPlaceDetails(placeId);
        if (activity != null) {
            return ResponseEntity.ok(activity);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}