package com.travelplatform.backend.service;

import com.travelplatform.backend.dto.ActivityPageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    public ActivityPageResponse getActivitiesByDestination(Long destinationId, int page, int size) {
        return getActivitiesWithPagination(destinationId, "all", null, page, size);
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

    public ActivityPageResponse getActivitiesByDestinationAndCategory(Long destinationId, String category, int page, int size) {
        return getActivitiesWithPagination(destinationId, category, null, page, size);
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

    // New overloaded version with pagination
    public ActivityPageResponse searchActivities(Long destinationId, String searchTerm, int page, int size) {
        return getActivitiesWithPagination(destinationId, "all", searchTerm, page, size);
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

        // Get the destination to ensure we're checking within the right city/country
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

                // First check: Exact placeId match (most reliable)
                if (activity.getPlaceId() != null) {
                    Optional<Activity> existingByPlaceId = activityRepository.findByPlaceId(activity.getPlaceId());
                    if (existingByPlaceId.isPresent()) {
                        Activity existingActivity = existingByPlaceId.get();
                        updateActivityWithNewData(existingActivity, activity);
                        savedActivities.add(activityRepository.save(existingActivity));
                        updatedCount++;
                        continue;
                    }
                }

                // Second check: Name match within the same destination only
                if (activity.getName() != null) {
                    Optional<Activity> existingByName = activityRepository
                            .findByDestinationIdAndNameIgnoreCase(destinationId, activity.getName());

                    if (existingByName.isPresent()) {
                        Activity existingActivity = existingByName.get();
                        updateActivityWithNewData(existingActivity, activity);
                        savedActivities.add(activityRepository.save(existingActivity));
                        updatedCount++;
                        continue;
                    }

                    // Simple fuzzy matching for same destination only
                    if (activity.getName().length() > 5) { // Only for meaningful names
                        List<Activity> similarActivities = activityRepository
                                .findByDestinationIdAndNameContaining(destinationId,
                                        activity.getName().split(" ")[0]); // Just first word

                        for (Activity similar : similarActivities) {
                            // Simple check: if >70% of words match AND same place ID area
                            if (isSimpleNameMatch(activity.getName(), similar.getName()) &&
                                    haveSimilarCoordinates(activity, similar)) {
                                updateActivityWithNewData(similar, activity);
                                savedActivities.add(activityRepository.save(similar));
                                updatedCount++;
                                continue;
                            }
                        }
                    }
                }



                // No duplicates found - save as new activity
                Activity saved = activityRepository.save(activity);
                savedActivities.add(saved);
                newCount++;

            } catch (Exception e) {
                logger.error("Error saving activity: {} for destination: {} ({})",
                        activity.getName(), destination.getName(), destination.getCountry(), e);
            }
        }

        logger.info("Saved {} new and updated {} existing activities for destination: {} ({})",
                newCount, updatedCount, destination.getName(), destination.getCountry());
        return savedActivities;
    }

    private boolean isSimpleNameMatch(String name1, String name2) {
        String[] words1 = name1.toLowerCase().split(" ");
        String[] words2 = name2.toLowerCase().split(" ");
        // Simple: if first two words match, consider it the same
        return words1[0].equals(words2[0]) &&
                (words1.length > 1 && words2.length > 1 ? words1[1].equals(words2[1]) : true);
    }

    private boolean haveSimilarCoordinates(Activity activity1, Activity activity2) {
        if (activity1.getLatitude() == null || activity1.getLongitude() == null ||
                activity2.getLatitude() == null || activity2.getLongitude() == null) {
            return false; // Can't compare without coordinates
        }

        double lat1 = activity1.getLatitude().doubleValue();
        double lon1 = activity1.getLongitude().doubleValue();
        double lat2 = activity2.getLatitude().doubleValue();
        double lon2 = activity2.getLongitude().doubleValue();

        // Calculate distance in kilometers

        double distance = calculateDistance(lat1, lon1, lat2, lon2);

        // Consider "similar" if within 500 meters
        return distance < 0.5;
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

    private String extractCoreActivityName(String fullName) {
        // Remove common suffixes/prefixes that create variations
        String core = fullName
                .replaceAll("(?i)\\s+(main|observatory|tower|building|center|centre)\\s*$", "")
                .replaceAll("(?i)^(the|a|an)\\s+", "")
                .trim();

        // Return at least the first major word(s)
        String[] words = core.split("\\s+");
        return words.length > 0 ? words[0] : fullName;
    }

    private Activity findMostSimilarActivity(Activity newActivity, List<Activity> candidates) {
        Activity mostSimilar = null;
        double highestSimilarity = 0.0;

        for (Activity candidate : candidates) {
            double similarity = calculateNameSimilarity(newActivity.getName(), candidate.getName());
            if (similarity > highestSimilarity && similarity > 0.7) { // 70% similarity threshold
                highestSimilarity = similarity;
                mostSimilar = candidate;
            }
        }

        return mostSimilar;
    }

    private double calculateNameSimilarity(String name1, String name2) {
        // Simple similarity calculation (could use more sophisticated algorithms)
        String lower1 = name1.toLowerCase();
        String lower2 = name2.toLowerCase();

        // Exact match
        if (lower1.equals(lower2)) return 1.0;

        // Check if one contains the other
        if (lower1.contains(lower2) || lower2.contains(lower1)) {
            return 0.8;
        }

        // Check common words
        String[] words1 = lower1.split("\\s+");
        String[] words2 = lower2.split("\\s+");

        int commonWords = 0;
        for (String word1 : words1) {
            for (String word2 : words2) {
                if (word1.equals(word2) && word1.length() > 2) { // Ignore short words like "of", "the"
                    commonWords++;
                    break;
                }
            }
        }

        return (double) commonWords / Math.max(words1.length, words2.length);
    }

    private boolean areLikelySamePlace(Activity activity1, Activity activity2) {
        // Additional checks beyond name similarity

        // If both have coordinates, check distance
        if (activity1.getLatitude() != null && activity1.getLongitude() != null &&
                activity2.getLatitude() != null && activity2.getLongitude() != null) {

            double distance = calculateDistance(
                    activity1.getLatitude().doubleValue(), activity1.getLongitude().doubleValue(),
                    activity2.getLatitude().doubleValue(), activity2.getLongitude().doubleValue()
            );

            // If they're within 100 meters, likely same place
            if (distance < 0.1) return true;
            // If they're more than 1km apart, definitely different places
            if (distance > 1.0) return false;
        }

        // Check if addresses are similar
        if (activity1.getAddress() != null && activity2.getAddress() != null) {
            double addressSimilarity = calculateNameSimilarity(activity1.getAddress(), activity2.getAddress());
            if (addressSimilarity > 0.8) return true;
        }

        // Same category is a good sign
        if (activity1.getCategory() != null && activity2.getCategory() != null) {
            return activity1.getCategory().equals(activity2.getCategory());
        }

        return false;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula for distance in kilometers
        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private boolean shouldUpdateWithBetterData(Activity existing, Activity newData) {
        return calculateDataCompleteness(newData) > calculateDataCompleteness(existing);
    }

    private int calculateDataCompleteness(Activity activity) {
        int score = 0;
        if (activity.getDescription() != null && !activity.getDescription().isEmpty()) score += 2; // Description is valuable
        if (activity.getPhotoUrl() != null) score++;
        if (activity.getRating() != null) score++;
        if (activity.getAddress() != null) score++;
        if (activity.getOpeningHours() != null) score++;
        if (activity.getPlaceId() != null) score++; // placeId is very valuable for future updates
        return score;
    }

    private ActivityPageResponse getActivitiesWithPagination(Long destinationId, String category, String searchTerm, int page, int size) {
        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page - 1, size);

        Page<Activity> activityPage;
        String source = "cached";

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            activityPage = activityRepository.searchByDestinationAndTermPaginated(destinationId, searchTerm.trim(), pageable);
        } else if (category != null && !category.equals("all")) {
            activityPage = activityRepository.findByDestinationIdAndCategoryOrderByPopularity(destinationId, category, pageable);
        } else {
            activityPage = activityRepository.findByDestinationIdOrderByPopularity(destinationId, pageable);
        }

        boolean needsApiCall = shouldFetchMoreFromApi(destinationId, activityPage, category, searchTerm);
        if (needsApiCall) {
            List<Activity> newActivities = fetchFromGooglePlaces(destinationId, category, searchTerm);
            if (!newActivities.isEmpty()) {
                saveActivitiesFromPlaces(newActivities, destinationId);
                source = "google_places_expanded";

                // Re-run the same query to get updated results
                if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                    activityPage = activityRepository.searchByDestinationAndTermPaginated(destinationId, searchTerm.trim(), pageable);
                } else if (category != null && !category.equals("all")) {
                    activityPage = activityRepository.findByDestinationIdAndCategoryOrderByPopularity(destinationId, category, pageable);
                } else {
                    activityPage = activityRepository.findByDestinationIdOrderByPopularity(destinationId, pageable);
                }
            }
        }

        ActivityPageResponse response = ActivityPageResponse.fromPage(activityPage, source);
        response.setQuery(searchTerm);
        response.setCategory(category);
        return response;
    }

    private boolean shouldFetchMoreFromApi(Long destinationId, Page<Activity> currentPage,
                                           String category, String searchTerm) {
        // Don't fetch if we're not on the last page of current results
        if (currentPage.hasNext()) {
            return false;
        }

        // Don't fetch if we already have a decent amount of data
        if (currentPage.getTotalElements() >= 100) {
            return false;
        }

        // For search queries, fetch if we have very few results
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return currentPage.getTotalElements() < 10;
        }

        // For categories, fetch if we have fewer than 30 activities
        if (category != null && !category.equals("all")) {
            return currentPage.getTotalElements() < 30;
        }

        // For general browsing, fetch if we have fewer than 50 activities
        return currentPage.getTotalElements() < 50;
    }

    private List<Activity> fetchFromGooglePlaces(Long destinationId, String category, String searchTerm) {
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return googlePlacesService.searchSpecificActivities(destinationId, searchTerm);
        } else if (category != null && !category.equals("all")) {
            return googlePlacesService.searchActivitiesByCategory(destinationId, category);
        } else {
            return googlePlacesService.searchActivitiesForDestination(destinationId, null);
        }
    }

}