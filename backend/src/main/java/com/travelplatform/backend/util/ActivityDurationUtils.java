package com.travelplatform.backend.util;

import java.util.HashMap;
import java.util.Map;

public class ActivityDurationUtils {

    // Default durations by category (in minutes)
    private static final Map<String, Integer> CATEGORY_DURATIONS = new HashMap<>();
    static {
        CATEGORY_DURATIONS.put("tourist_attraction", 120);
        CATEGORY_DURATIONS.put("museum", 180);
        CATEGORY_DURATIONS.put("restaurant", 90);
        CATEGORY_DURATIONS.put("park", 60);
        CATEGORY_DURATIONS.put("shopping_mall", 120);
        CATEGORY_DURATIONS.put("amusement_park", 360);
        CATEGORY_DURATIONS.put("zoo", 240);
        CATEGORY_DURATIONS.put("aquarium", 150);
        CATEGORY_DURATIONS.put("church", 45);
        CATEGORY_DURATIONS.put("market", 90);
        CATEGORY_DURATIONS.put("viewpoint", 30);
        CATEGORY_DURATIONS.put("beach", 180);
        CATEGORY_DURATIONS.put("hiking_trail", 240);
        CATEGORY_DURATIONS.put("spa", 120);
        CATEGORY_DURATIONS.put("nightclub", 180);
        CATEGORY_DURATIONS.put("theater", 150);
        CATEGORY_DURATIONS.put("stadium", 180);
        CATEGORY_DURATIONS.put("custom", 120);
    }
    // Default cost estimates by category (in cents)
    private static final Map<String, Double> CATEGORY_COSTS = new HashMap<>();
    static {
        CATEGORY_COSTS.put("tourist_attraction", 2000.0);   // $20
        CATEGORY_COSTS.put("museum", 1500.0);               // $15
        CATEGORY_COSTS.put("restaurant", 3000.0);           // $30
        CATEGORY_COSTS.put("park", 0.0);                    // Free
        CATEGORY_COSTS.put("shopping_mall", 5000.0);        // $50 (shopping budget)
        CATEGORY_COSTS.put("amusement_park", 5000.0);       // $50
        CATEGORY_COSTS.put("zoo", 2500.0);                  // $25
        CATEGORY_COSTS.put("aquarium", 2000.0);             // $20
        CATEGORY_COSTS.put("church", 0.0);                  // Free
        CATEGORY_COSTS.put("market", 1000.0);               // $10
        CATEGORY_COSTS.put("viewpoint", 0.0);               // Free
        CATEGORY_COSTS.put("beach", 0.0);                   // Free
        CATEGORY_COSTS.put("hiking_trail", 0.0);            // Free
        CATEGORY_COSTS.put("spa", 8000.0);                  // $80
        CATEGORY_COSTS.put("nightclub", 4000.0);            // $40
        CATEGORY_COSTS.put("theater", 3500.0);              // $35
        CATEGORY_COSTS.put("stadium", 4000.0);              // $40
        CATEGORY_COSTS.put("custom", 0.0);                  // User-defined
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

    /**
     * Get default cost estimate for an activity category
     *
     * @param category The activity category
     * @return Cost estimate in cents
     */
    public static Double getDefaultCostEstimate(String category) {
        if (category == null) {
            return CATEGORY_COSTS.get("custom");
        }
        return CATEGORY_COSTS.getOrDefault(category.toLowerCase(), CATEGORY_COSTS.get("custom"));
    }

    /**
     * Check if a category is valid
     * @param category The category to check
     * @return true if valid, false otherwise
     */
    public static boolean isValidCategory(String category) {
        if (category == null) {
            return false;
        }
        return CATEGORY_DURATIONS.containsKey(category.toLowerCase());
    }

    /**
     * Get all supported categories
     * @return Set of all supported category names
     */
    public static java.util.Set<String> getSupportedCategories() {
        return CATEGORY_DURATIONS.keySet();
    }

    /**
     * Format duration as human-readable string
     * @param durationMinutes Duration in minutes
     * @return Formatted string like "2h 30m"
     */
    public static String formatDuration(Integer durationMinutes) {
        if (durationMinutes == null || durationMinutes <= 0) {
            return "0m";
        }

        int hours = durationMinutes / 60;
        int minutes = durationMinutes % 60;

        if (hours == 0) {
            return minutes + "m";
        } else if (minutes == 0) {
            return hours + "h";
        } else {
            return hours + "h " + minutes + "m";
        }
    }

    public static String formatCost(Double costDollars) {
        if (costDollars == null || costDollars == 0) {
            return "Free";
        }
        return String.format("$%.2f", costDollars);
    }
}