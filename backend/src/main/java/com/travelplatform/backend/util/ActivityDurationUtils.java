package com.travelplatform.backend.util;

import java.util.HashMap;
import java.util.Map;

public class ActivityDurationUtils {

    // Default durations by category (in minutes)
    private static final Map<String, Integer> CATEGORY_DURATIONS = new HashMap<>();
    static {
        CATEGORY_DURATIONS.put("tourist_attraction", 45);  // 45 minutes instead of 2 hours
        CATEGORY_DURATIONS.put("museum", 90);              // 1.5 hours instead of 3 hours
        CATEGORY_DURATIONS.put("restaurant", 90);          // 1.5 hours
        CATEGORY_DURATIONS.put("park", 75);                // 1.25 hours instead of 1 hour
        CATEGORY_DURATIONS.put("shopping_mall", 120);      // 2 hours
        CATEGORY_DURATIONS.put("amusement_park", 240);     // 4 hours instead of 6 hours
        CATEGORY_DURATIONS.put("zoo", 180);                // 3 hours instead of 4 hours
        CATEGORY_DURATIONS.put("aquarium", 120);           // 2 hours instead of 2.5 hours
        CATEGORY_DURATIONS.put("church", 45);              // 45 minutes
        CATEGORY_DURATIONS.put("mosque", 45);              // 45 minutes
        CATEGORY_DURATIONS.put("synagogue", 45);           // 45 minutes
        CATEGORY_DURATIONS.put("temple", 45);              // 45 minutes
        CATEGORY_DURATIONS.put("hindu_temple", 45);        // 45 minutes
        CATEGORY_DURATIONS.put("market", 90);              // 1.5 hours
        CATEGORY_DURATIONS.put("viewpoint", 30);           // 30 minutes
        CATEGORY_DURATIONS.put("beach", 120);              // 2 hours instead of 3 hours
        CATEGORY_DURATIONS.put("hiking_trail", 180);       // 3 hours instead of 4 hours
        CATEGORY_DURATIONS.put("spa", 120);                // 2 hours
        CATEGORY_DURATIONS.put("nightclub", 120);          // 2 hours instead of 3 hours
        CATEGORY_DURATIONS.put("theater", 150);            // 2.5 hours
        CATEGORY_DURATIONS.put("stadium", 180);            // 3 hours
        CATEGORY_DURATIONS.put("custom", 90);              // 1.5 hours default instead of 2 hours
    }

    /**
     * Get default duration for an activity category
     * @param category The activity category
     * @return Duration in minutes
     */
    public static Integer getDefaultDuration(String category) {
        if (category == null) {
            return CATEGORY_DURATIONS.get("custom");
        }
        return CATEGORY_DURATIONS.getOrDefault(category.toLowerCase(), CATEGORY_DURATIONS.get("custom"));
    }
}