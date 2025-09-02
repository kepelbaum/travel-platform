package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.exception.DestinationNotFoundException;
import com.travelplatform.backend.repository.ActivityRepository;
import com.travelplatform.backend.repository.DestinationRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ActivityService {

    private static final Logger logger = LoggerFactory.getLogger(GooglePlacesService.class);

    // Cache configuration constant
    private static final int CACHE_TTL_DAYS = 30;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private GooglePlacesService googlePlacesService;

    @Autowired
    private CostMultiplierService costMultiplierService;

    /**
     * Get ALL activities for a destination with smart caching
     * Returns complete dataset for frontend pagination
     */
    public List<Activity> getAllActivitiesByDestination(Long destinationId) {
        logger.info("Fetching all activities for destination: {}", destinationId);

        // Smart refresh logic - check if stale and refresh if needed
        if (shouldRefreshFromGooglePlaces(destinationId)) {
            logger.info("Cache is stale, refreshing from Google Places for destination: {}", destinationId);
            refreshActivitiesFromGooglePlaces(destinationId);
        }

        // Return ALL activities from database
        List<Activity> allActivities = activityRepository.findByDestinationId(destinationId);
        logger.info("Returning {} total activities for destination: {}", allActivities.size(), destinationId);
        return allActivities;
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
     */
    @Transactional
    public List<Activity> saveActivitiesFromPlaces(List<Activity> activities, Long destinationId) {
        List<Activity> savedActivities = new ArrayList<>();

        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            throw new DestinationNotFoundException(destinationId);
        }
        Destination destination = destinationOpt.get();

        int newCount = 0;
        int updatedCount = 0;
        Set<String> processedInBatch = new HashSet<>(); // Prevent within-batch duplicates

        for (Activity activity : activities) {
            try {
                activity.setDestination(destination);

                if (activity.getEstimatedCost() != null) {
                    double adjustedCost = costMultiplierService.applyMultiplier(
                            activity.getEstimatedCost(), destination.getName());
                    activity.setEstimatedCost((double) Math.round(adjustedCost));
                }

                // Skip if already processed in this batch
                if (activity.getPlaceId() != null && processedInBatch.contains(activity.getPlaceId())) {
                    continue;
                }

                // Check for existing activity (atomic within transaction)
                Optional<Activity> existingByPlaceId = activity.getPlaceId() != null
                        ? activityRepository.findByPlaceId(activity.getPlaceId())
                        : Optional.empty();

                if (existingByPlaceId.isPresent()) {
                    Activity existingActivity = existingByPlaceId.get();
                    updateActivityWithNewData(existingActivity, activity);
                    savedActivities.add(activityRepository.save(existingActivity));
                    updatedCount++;
                } else {
                    // Fallback name check for same destination
                    Optional<Activity> existingByName = activity.getName() != null
                            ? activityRepository.findByDestinationIdAndNameIgnoreCase(destinationId, activity.getName())
                            : Optional.empty();

                    if (existingByName.isPresent()) {
                        Activity existingActivity = existingByName.get();
                        updateActivityWithNewData(existingActivity, activity);
                        savedActivities.add(activityRepository.save(existingActivity));
                        updatedCount++;
                    } else {
                        Activity saved = activityRepository.save(activity);
                        savedActivities.add(saved);
                        newCount++;
                    }
                }

                // Track processed place IDs
                if (activity.getPlaceId() != null) {
                    processedInBatch.add(activity.getPlaceId());
                }

            } catch (Exception e) {
                logger.error("Error saving activity: {} for destination: {} ({})",
                        activity.getName(), destination.getName(), destination.getCountry(), e);
            }
        }

        logger.info("Saved {} new and updated {} existing activities for destination: {} ({})",
                newCount, updatedCount, destination.getName(), destination.getCountry());
        return savedActivities;
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
        public LocalDateTime getLastRefresh() { return lastRefresh; }
        public boolean isCacheStale() { return isCacheStale; }
        public int getCacheTtlDays() { return cacheTtlDays; }
    }

    // Helper method for fetching from Google Places (used by other endpoints)
    private List<Activity> fetchFromGooglePlaces(Long destinationId, String category, String searchTerm) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new DestinationNotFoundException(destinationId));

        String cityName = destination.getName();
        String country = destination.getCountry();
        Set<String> seenPlaceIds = new HashSet<>();
        List<Activity> allActivities = new ArrayList<>();

        List<String> queries = Arrays.asList(
                "top attractions in " + cityName + " " + country,
                "museums in " + cityName + " " + country,
                "restaurants in " + cityName + " " + country,
                "parks in " + cityName + " " + country,
                "temples in " + cityName + " " + country,
                "shopping in " + cityName + " " + country,
                "entertainment in " + cityName + " " + country
        );

        // First, collect all basic activities from text searches
        for (String query : queries) {
            List<Activity> results = googlePlacesService.performSingleSearch(query, destination);

            for (Activity activity : results) {
                if (activity.getPlaceId() != null && !seenPlaceIds.contains(activity.getPlaceId())) {
                    allActivities.add(activity);
                    seenPlaceIds.add(activity.getPlaceId());
                }
            }

            try { Thread.sleep(200); } catch (InterruptedException e) { break; }
        }

        // Then enrich each activity with Place Details for descriptions, hours, etc.
        logger.info("Enriching {} activities with place details", allActivities.size());
        for (int i = 0; i < allActivities.size(); i++) {
            Activity activity = allActivities.get(i);
            if (activity.getPlaceId() != null) {
                try {
                    logger.info("Enriching activity {}/{}: {}", i + 1, allActivities.size(), activity.getName());
                    Activity detailedActivity = googlePlacesService.getPlaceDetails(activity.getPlaceId());

                    if (detailedActivity != null) {
                        // Copy enhanced data
                        if (detailedActivity.getDescription() != null &&
                                !detailedActivity.getDescription().equals("No description available.")) {
                            activity.setDescription(detailedActivity.getDescription());
                        }
                        if (detailedActivity.getOpeningHours() != null) {
                            activity.setOpeningHours(detailedActivity.getOpeningHours());
                        }
                        if (detailedActivity.getReviewsJson() != null) {
                            activity.setReviewsJson(detailedActivity.getReviewsJson());
                        }
                        if (detailedActivity.getRating() != null) {
                            activity.setRating(detailedActivity.getRating());
                        }
                        if (detailedActivity.getUserRatingsTotal() != null) {
                            activity.setUserRatingsTotal(detailedActivity.getUserRatingsTotal());
                        }
                        if (detailedActivity.getWebsite() != null) {
                            activity.setWebsite(detailedActivity.getWebsite());
                        }
                        if (detailedActivity.getPhone() != null) {
                            activity.setPhone(detailedActivity.getPhone());
                        }
                        // Apply city-based cost multiplier if price level is available
                        if (detailedActivity.getPriceLevel() != null) {
                            activity.setPriceLevel(detailedActivity.getPriceLevel());
                            double baseCost = googlePlacesService.mapPriceLevelToCost(detailedActivity.getPriceLevel());
                            double adjustedCost = costMultiplierService.applyMultiplier(baseCost, destination.getName());
                            activity.setEstimatedCost(adjustedCost);
                        }
                    }

                    Thread.sleep(100); // Rate limiting between place details calls
                } catch (Exception e) {
                    logger.warn("Failed to enrich activity {}: {}", activity.getName(), e.getMessage());
                }
            }
        }

        logger.info("Found {} total unique activities for {}", allActivities.size(), cityName);
        return allActivities;
    }
}