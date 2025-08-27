package com.travelplatform.backend.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CostMultiplierService {

    private static final Map<String, Double> CITY_MULTIPLIERS = Map.ofEntries(
            // Very High Cost Cities (relative to NYC baseline)
            Map.entry("Zurich", 1.30),
            Map.entry("Reykjavik", 1.20),
            Map.entry("Singapore", 1.15),

            // High Cost Cities
            Map.entry("New York", 1.0),  // Baseline
            Map.entry("San Francisco", 0.95),
            Map.entry("London", 0.90),
            Map.entry("Hong Kong", 0.88),
            Map.entry("Paris", 0.85),
            Map.entry("Tokyo", 0.82),

            // Moderately High Cost Cities
            Map.entry("Amsterdam", 0.80),
            Map.entry("Sydney", 0.80),
            Map.entry("Kyoto", 0.79),
            Map.entry("Vienna", 0.79),
            Map.entry("Dubai", 0.71),
            Map.entry("Montreal", 0.71),
            Map.entry("Seoul", 0.67),
            Map.entry("Jerusalem", 0.67),
            Map.entry("Barcelona", 0.63),
            Map.entry("Rome", 0.63),

            // Moderate Cost Cities
            Map.entry("Prague", 0.58),
            Map.entry("Berlin", 0.54),
            Map.entry("Warsaw", 0.46),
            Map.entry("Athens", 0.46),

            // Lower Cost Cities
            Map.entry("Shanghai", 0.38),
            Map.entry("Moscow", 0.30),
            Map.entry("Buenos Aires", 0.33),
            Map.entry("St. Petersburg", 0.28),
            Map.entry("Cape Town", 0.28),
            Map.entry("Istanbul", 0.25),
            Map.entry("Bangkok", 0.20)
    );

    public double getCostMultiplier(String cityName) {
        return CITY_MULTIPLIERS.getOrDefault(cityName, 1.0);
    }

    public double applyMultiplier(double baseCost, String cityName) {
        return baseCost * getCostMultiplier(cityName);
    }
}