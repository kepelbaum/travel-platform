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
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ActivityService {

    private static final Logger logger = LoggerFactory.getLogger(GooglePlacesService.class);

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    public List<Activity> getActivitiesByDestination(Long destinationId) {
        return activityRepository.findByDestinationId(destinationId);
    }

    public List<Activity> getActivitiesByDestinationAndCategory(Long destinationId, String category) {
        return activityRepository.findByDestinationIdAndCategory(destinationId, category);
    }

    public Activity createCustomActivity(Long destinationId, String name, String category,
                                         Integer durationMinutes, Double costEstimate, String description) {
        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            throw new RuntimeException("Destination not found with id: " + destinationId);
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

    public Optional<Activity> getActivityById(Long id) {
        return Optional.ofNullable(activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException(id)));
    }

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

    public void deleteActivity(Long id) {
        if (!activityRepository.existsById(id)) {
            throw new ActivityNotFoundException(id);
        }
        activityRepository.deleteById(id);
    }

    public List<Activity> searchActivities(Long destinationId, String searchTerm) {
        return activityRepository.searchByDestinationAndTerm(destinationId, searchTerm);
    }

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
    public List<Activity> saveActivitiesFromPlaces(List<Activity> activities, Long destinationId) {
        List<Activity> savedActivities = new ArrayList<>();

        // Get the destination
        Optional<Destination> destinationOpt = destinationRepository.findById(destinationId);
        if (destinationOpt.isEmpty()) {
            throw new RuntimeException("Destination not found with id: " + destinationId);
        }
        Destination destination = destinationOpt.get();

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
                        continue;
                    }
                }

                Activity saved = activityRepository.save(activity);
                savedActivities.add(saved);

            } catch (Exception e) {
                logger.error("Error saving activity: {}", activity.getName(), e);
                // Continue with other activities even if one fails
            }
        }

        return savedActivities;
    }

    /**
     * Get activities by city name
     */
    public List<Activity> getActivitiesByCity(String cityName) {
        return activityRepository.findByCityNameIgnoreCase(cityName);
    }

    /**
     * Enhance existing activity with fresh Google Places data
     */
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

    /**
     * Get all unique activity categories
     */
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
    }
}