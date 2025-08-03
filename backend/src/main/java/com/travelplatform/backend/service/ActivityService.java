package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.repository.ActivityRepository;
import com.travelplatform.backend.repository.DestinationRepository;
import com.travelplatform.backend.util.ActivityDurationUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ActivityService {

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
                                         Integer durationMinutes, Integer costEstimate, String description) {
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
            activity.setCostEstimate(costEstimate);
        } else {
            activity.setCostEstimate(ActivityDurationUtils.getDefaultCostEstimate(category));
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
            throw new RuntimeException("Destination not found with id: " + destinationId);
        }

        Destination destination = destinationOpt.get();
        Activity activity = Activity.createFromGooglePlaces(placeId, name, category, destination);
        activity.setDescription(description);

        activity.setDurationMinutes(ActivityDurationUtils.getDefaultDuration(category));
        activity.setCostEstimate(ActivityDurationUtils.getDefaultCostEstimate(category));

        return activityRepository.save(activity);
    }

    public Optional<Activity> getActivityById(Long id) {
        return Optional.ofNullable(activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException(id)));
    }

    public Activity updateActivity(Long id, String name, String description, String category,
                                   Integer durationMinutes, Integer costEstimate) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException(id));

        if (name != null) activity.setName(name);
        if (description != null) activity.setDescription(description);
        if (category != null) activity.setCategory(category);
        if (durationMinutes != null) activity.setDurationMinutes(durationMinutes);
        if (costEstimate != null) activity.setCostEstimate(costEstimate);

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
}