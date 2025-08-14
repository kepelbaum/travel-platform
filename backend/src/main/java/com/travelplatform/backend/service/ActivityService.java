package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.exception.DestinationNotFoundException;
import com.travelplatform.backend.repository.ActivityRepository;
import com.travelplatform.backend.repository.DestinationRepository;
import com.travelplatform.backend.util.ActivityDurationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ActivityService {

    private static final Logger logger = LoggerFactory.getLogger(GooglePlacesService.class);

    // Cache configuration constant
    private static final int CACHE_TTL_DAYS = 7;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private GooglePlacesService googlePlacesService;

    /**
     * Get activities by destination with intelligent caching
     * Checks cache freshness and refreshes from Google Places if stale
     */
    @Cacheable(value = "destinationActivities", key = "#destinationId")
    public List<Activity> getActivitiesByDestination(Long destinationId) {
        return getActivitiesWithSmartRefresh(destinationId, false);
    }

    /**
     * Force refresh activities from Google Places API (bypasses cache)
     */
    @CacheEvict(value = "destinationActivities", key = "#destinationId")
    public List<Activity> forceRefreshActivities(Long destinationId) {
        return getActivitiesWithSmartRefresh(destinationId, true);
    }

    /**
     * Smart activity fetching with cache management
     */
    private List<Activity> getActivitiesWithSmartRefresh(Long destinationId, boolean forceRefresh) {
        logger.info("Fetching activities for destination: {} (forceRefresh: {})", destinationId, forceRefresh);

        // If force refresh or cache is stale, get fresh data from Google Places
        if (forceRefresh || shouldRefreshFromGooglePlaces(destinationId)) {
            return refreshActivitiesFromGooglePlaces(destinationId);
        }

        // Return existing cached data
        List<Activity> activities = activityRepository.findByDestinationId(destinationId);
        logger.info("Returning {} cached activities for destination: {}", activities.size(), destinationId);
        return activities;
    }

    /**
     * Check if we should refresh activities from Google Places API
     */
    private boolean shouldRefreshFromGooglePlaces(Long destinationId) {
        // Check if we have any activities for this destination
        long activityCount = getActivityCount(destinationId);

        if (activityCount == 0) {
            logger.info("No activities found for destination: {}, will fetch from Google Places", destinationId);
            return true;
        }

        // Check if our cached data is stale (older than CACHE_TTL_DAYS)
        Optional<Activity> mostRecentActivity = getMostRecentActivity(destinationId);
        if (mostRecentActivity.isPresent()) {
            LocalDateTime lastUpdate = mostRecentActivity.get().getUpdatedAt();
            if (lastUpdate != null) {
                LocalDateTime cacheExpiry = lastUpdate.plusDays(CACHE_TTL_DAYS);

                if (LocalDateTime.now().isAfter(cacheExpiry)) {
                    logger.info("Cached activities for destination: {} are stale (older than {} days), will refresh",
                            destinationId, CACHE_TTL_DAYS);
                    return true;
                }
            }
        }

        logger.info("Using fresh cached activities for destination: {}", destinationId);
        return false;
    }

    /**
     * Refresh activities from Google Places API
     */
    private List<Activity> refreshActivitiesFromGooglePlaces(Long destinationId) {
        logger.info("Refreshing activities from Google Places API for destination: {}", destinationId);

        try {
            // Fetch fresh data from Google Places
            List<Activity> newActivities = googlePlacesService.searchActivitiesForDestination(destinationId, null);

            if (newActivities.isEmpty()) {
                logger.warn("Google Places API returned no activities for destination: {}", destinationId);
                // Return existing cached data as fallback
                return activityRepository.findByDestinationId(destinationId);
            }

            // Save new activities (existing method handles duplicates)
            List<Activity> savedActivities = saveActivitiesFromPlaces(newActivities, destinationId);

            logger.info("Successfully refreshed {} activities for destination: {}", savedActivities.size(), destinationId);
            return savedActivities;

        } catch (Exception e) {
            logger.error("Failed to refresh activities from Google Places for destination: {}", destinationId, e);
            // Graceful degradation - return cached data
            return activityRepository.findByDestinationId(destinationId);
        }
    }

    /**
     * Get most recently updated activity for cache freshness check
     */
    private Optional<Activity> getMostRecentActivity(Long destinationId) {
        List<Activity> activities = activityRepository.findByDestinationId(destinationId);
        return activities.stream()
                .filter(a -> a.getUpdatedAt() != null)
                .max((a1, a2) -> a1.getUpdatedAt().compareTo(a2.getUpdatedAt()));
    }

    /**
     * Get cache statistics for monitoring
     */
    public CacheStats getCacheStats(Long destinationId) {
        long totalActivities = getActivityCount(destinationId);
        long googlePlacesActivities = activityRepository.findByDestinationIdAndIsCustomFalse(destinationId).size();
        long customActivities = activityRepository.findByDestinationIdAndIsCustomTrue(destinationId).size();

        Optional<Activity> mostRecent = getMostRecentActivity(destinationId);
        LocalDateTime lastRefresh = mostRecent.map(Activity::getUpdatedAt).orElse(null);

        boolean isCacheStale = lastRefresh != null &&
                LocalDateTime.now().isAfter(lastRefresh.plusDays(CACHE_TTL_DAYS));

        return new CacheStats(
                totalActivities,
                googlePlacesActivities,
                customActivities,
                lastRefresh,
                isCacheStale,
                CACHE_TTL_DAYS
        );
    }

    @Cacheable(value = "categoryActivities", key = "#destinationId + '_' + #category")
    public List<Activity> getActivitiesByDestinationAndCategory(Long destinationId, String category) {
        return activityRepository.findByDestinationIdAndCategory(destinationId, category);
    }

    @CacheEvict(value = {"destinationActivities", "categoryActivities", "activityById"}, allEntries = true)
    public Activity createCustomActivity(Long destinationId, String name, String category,
                                         Integer durationMinutes, Double costEstimate, String description) {
        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            throw new DestinationNotFoundException(destinationId);
        }

        Destination destination = destinationOpt.get();
        Activity activity = Activity.createCustomActivity(name, category, destination);

        if (durationMinutes != null) {
            activity.setDurationMinutes(durationMinutes);
        } else {
            activity.setDurationMinutes(ActivityDurationUtils.getDefaultDuration(category));
        }

        if (costEstimate != null) {
            activity.setEstimatedCost(costEstimate);
        } else {
            activity.setEstimatedCost(ActivityDurationUtils.getDefaultCostEstimate(category));
        }

        if (description != null) {
            activity.setDescription(description);
        }

        return activityRepository.save(activity);
    }

    public Activity createFromGooglePlaces(Long destinationId, String placeId, String name,
                                           String category, String description) {
        Optional<Activity> existingActivity = activityRepository.findByPlaceId(placeId);
        if (existingActivity.isPresent()) {
            return existingActivity.get();
        }

        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            throw new DestinationNotFoundException("Destination not found with id: " + destinationId);
        }

        Destination destination = destinationOpt.get();
        Activity activity = Activity.createFromGooglePlaces(placeId, name, category, destination);
        activity.setDescription(description);

        activity.setDurationMinutes(ActivityDurationUtils.getDefaultDuration(category));
        activity.setEstimatedCost(ActivityDurationUtils.getDefaultCostEstimate(category));

        return activityRepository.save(activity);
    }

    @Cacheable(value = "activityById", key = "#id")
    public Optional<Activity> getActivityById(Long id) {
        return Optional.ofNullable(activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException(id)));
    }

    @CacheEvict(value = {"activityById", "destinationActivities", "categoryActivities"}, allEntries = true)
    public Activity updateActivity(Long id, String name, String description, String category,
                                   Integer durationMinutes, Double costEstimate) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException(id));

        if (name != null) activity.setName(name);
        if (description != null) activity.setDescription(description);
        if (category != null) activity.setCategory(category);
        if (durationMinutes != null) activity.setDurationMinutes(durationMinutes);
        if (costEstimate != null) activity.setEstimatedCost(costEstimate);

        return activityRepository.save(activity);
    }

    @CacheEvict(value = {"activityById", "destinationActivities", "categoryActivities"}, allEntries = true)
    public void deleteActivity(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new ActivityNotFoundException(id);
        }
        activityRepository.deleteById(id);
    }

    public List<Activity> searchActivities(Long destinationId, String searchTerm) {
        return activityRepository.searchByDestinationAndTerm(destinationId, searchTerm);
    }

    @Cacheable(value = "topRatedActivities", key = "#destinationId")
    public List<Activity> getTopRatedActivities(Long destinationId) {
        return activityRepository.findTopRatedByDestination(destinationId);
    }

    public List<Activity> getActivitiesByCostRange(Long destinationId, Integer minCost, Integer maxCost) {
        return activityRepository.findByDestinationAndCostRange(destinationId, minCost, maxCost);
    }

    public long getActivityCount(Long destinationId) {
        return activityRepository.countByDestinationId(destinationId);
    }

    /**
     * Save activities from Google Places API, avoiding duplicates
     * Enhanced with better logging for cache monitoring
     */
    public List<Activity> saveActivitiesFromPlaces(List<Activity> activities, Long destinationId) {
        List<Activity> savedActivities = new ArrayList<>();

        // Get the destination
        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            throw new RuntimeException("Destination not found with id: " + destinationId);
        }
        Destination destination = destinationOpt.get();

        int newCount = 0;
        int updatedCount = 0;

        for (Activity activity : activities) {
            try {
                activity.setDestination(destination);

                // Check if activity with this placeId already exists
                if (activity.getPlaceId() != null) {
                    Optional<Activity> existing = activityRepository.findByPlaceId(activity.getPlaceId());
                    if (existing.isPresent()) {
                        // Update existing activity with new data
                        Activity existingActivity = existing.get();
                        updateActivityWithNewData(existingActivity, activity);
                        savedActivities.add(activityRepository.save(existingActivity));
                        updatedCount++;
                        continue;
                    }
                }

                Activity saved = activityRepository.save(activity);
                savedActivities.add(saved);
                newCount++;

            } catch (Exception e) {
                logger.error("Error saving activity: {}", activity.getName(), e);
                // Continue with other activities even if one fails
            }
        }

        logger.info("Saved {} new and updated {} existing activities for destination: {}",
                newCount, updatedCount, destinationId);
        return savedActivities;
    }

    public List<Activity> getActivitiesByCity(String cityName) {
        return activityRepository.findByCityNameIgnoreCase(cityName);
    }

    public Activity enhanceActivityWithPlacesData(Activity existing, Activity placesData) {
        if (placesData.getPhotoUrl() != null) {
            existing.setPhotoUrl(placesData.getPhotoUrl());
        }
        if (placesData.getRating() != null) {
            existing.setRating(placesData.getRating());
        }
        if (placesData.getEstimatedCost() != null) {
            existing.setEstimatedCost(placesData.getEstimatedCost());
        }
        if (placesData.getCategory() != null) {
            existing.setCategory(placesData.getCategory());
        }

        return activityRepository.save(existing);
    }

    @Cacheable(value = "activityCategories")
    public List<String> getAllCategories() {
        return activityRepository.findDistinctCategories();
    }

    private void updateActivityWithNewData(Activity existing, Activity newData) {
        // Update fields that might have changed
        if (newData.getDescription() != null) {
            existing.setDescription(newData.getDescription());
        }
        if (newData.getRating() != null) {
            existing.setRating(newData.getRating());
        }
        if (newData.getEstimatedCost() != null) {
            existing.setEstimatedCost(newData.getEstimatedCost());
        }
        if (newData.getPhotoUrl() != null) {
            existing.setPhotoUrl(newData.getPhotoUrl());
        }
        if (newData.getCategory() != null) {
            existing.setCategory(newData.getCategory());
        }

        // Update timestamp for cache freshness tracking
        existing.setUpdatedAt(LocalDateTime.now());
    }

    public static class CacheStats {
        private final long totalActivities;
        private final long googlePlacesActivities;
        private final long customActivities;
        private final LocalDateTime lastRefresh;
        private final boolean isCacheStale;
        private final int cacheTtlDays;

        public CacheStats(long totalActivities, long googlePlacesActivities, long customActivities,
                          LocalDateTime lastRefresh, boolean isCacheStale, int cacheTtlDays) {
            this.totalActivities = totalActivities;
            this.googlePlacesActivities = googlePlacesActivities;
            this.customActivities = customActivities;
            this.lastRefresh = lastRefresh;
            this.isCacheStale = isCacheStale;
            this.cacheTtlDays = cacheTtlDays;
        }

        public long getTotalActivities() { return totalActivities; }
        public long getGooglePlacesActivities() { return googlePlacesActivities; }
        public long getCustomActivities() { return customActivities; }
        public LocalDateTime getLastRefresh() { return lastRefresh; }
        public boolean isCacheStale() { return isCacheStale; }
        public int getCacheTtlDays() { return cacheTtlDays; }
    }
}