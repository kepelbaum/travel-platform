package com.travelplatform.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.repository.DestinationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class GooglePlacesService {

    private static final Logger logger = LoggerFactory.getLogger(GooglePlacesService.class);

    @Value("${google.places.api.key:not-configured}")
    private String apiKey;

    @Autowired
    private DestinationRepository destinationRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String PLACES_API_BASE_URL = "https://maps.googleapis.com/maps/api/place";
    private static final String TEXT_SEARCH_ENDPOINT = "/textsearch/json";
    private static final String PLACE_DETAILS_ENDPOINT = "/details/json";

    @Autowired
    public GooglePlacesService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Search for activities/attractions for a specific destination
     */
    public List<Activity> searchActivitiesForDestination(Long destinationId, String type) {
        try {
            Destination destination = destinationRepository.findById(destinationId)
                    .orElseThrow(() -> new RuntimeException("Destination not found: " + destinationId));

            String cityName = destination.getName();
            String query = (type != null && !type.isEmpty())
                    ? type + " in " + cityName
                    : "tourist attractions in " + cityName;

            String url = UriComponentsBuilder.fromHttpUrl(PLACES_API_BASE_URL + TEXT_SEARCH_ENDPOINT)
                    .queryParam("query", query)
                    .queryParam("key", apiKey)
                    .queryParam("language", "en")
                    .build()
                    .toUriString();

            logger.info("Searching for activities in destination: {} ({})", destinationId, cityName);
            String response = restTemplate.getForObject(url, String.class);

            logger.info("Built URL: {}", url);
            logger.info("Google API response: {}", response);

            return parseActivitiesFromResponse(response);

        } catch (Exception e) {
            logger.error("Error searching for activities in destination: {}", destinationId, e);
            return new ArrayList<>();
        }
    }

    /**
     * Get detailed information about a specific place
     */
    public Activity getPlaceDetails(String placeId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(PLACES_API_BASE_URL + PLACE_DETAILS_ENDPOINT)
                    .queryParam("place_id", placeId)
                    .queryParam("key", apiKey)
                    .queryParam("fields", "name,formatted_address,rating,price_level,photos,opening_hours,website,reviews,types,geometry,formatted_phone_number,international_phone_number")
                    .build()
                    .toUriString();

            logger.info("Getting details for place: {}", placeId);
            String response = restTemplate.getForObject(url, String.class);

            return parsePlaceDetailsFromResponse(response);

        } catch (Exception e) {
            logger.error("Error getting place details for placeId: {}", placeId, e);
            return null;
        }
    }

    /**
     * Search for specific types of places (restaurants, museums, etc.)
     */
    public List<Activity> searchPlacesByType(Long destinationId, String placeType) {
        try {
            Destination destination = destinationRepository.findById(destinationId)
                    .orElseThrow(() -> new RuntimeException("Destination not found: " + destinationId));

            String cityName = destination.getName();
            String query = placeType + " in " + cityName;

            String url = UriComponentsBuilder.fromHttpUrl(PLACES_API_BASE_URL + TEXT_SEARCH_ENDPOINT)
                    .queryParam("query", query)
                    .queryParam("key", apiKey)
                    .queryParam("type", placeType)
                    .queryParam("language", "en")
                    .build()
                    .toUriString();

            logger.info("Searching for {} in destination: {} ({})", placeType, destinationId, cityName);
            String response = restTemplate.getForObject(url, String.class);

            return parseActivitiesFromResponse(response);

        } catch (Exception e) {
            logger.error("Error searching for {} in destination: {}", placeType, destinationId, e);
            return new ArrayList<>();
        }
    }

    private List<Activity> parseActivitiesFromResponse(String response) {
        List<Activity> activities = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.get("results");

            if (results != null && results.isArray()) {
                for (JsonNode result : results) {
                    Activity activity = parseActivityFromJson(result);
                    if (activity != null) {
                        activities.add(activity);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error parsing activities from response", e);
        }

        return activities;
    }

    private Activity parsePlaceDetailsFromResponse(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode result = root.get("result");

            if (result != null) {
                return parseActivityFromJson(result);
            }

        } catch (Exception e) {
            logger.error("Error parsing place details from response", e);
        }

        return null;
    }

    private Activity parseActivityFromJson(JsonNode json) {
        try {
            Activity activity = new Activity();

            // Basic info
            activity.setName(json.has("name") ? json.get("name").asText() : "Unknown");
            activity.setDescription(json.has("formatted_address") ? json.get("formatted_address").asText() : "");
            activity.setPlaceId(json.has("place_id") ? json.get("place_id").asText() : null);

            // Rating (keep as BigDecimal to match ntity)
            if (json.has("rating")) {
                double googleRating = json.get("rating").asDouble();
                activity.setRating(BigDecimal.valueOf(googleRating));
            }

            // Price level and estimated cost
            if (json.has("price_level")) {
                int priceLevel = json.get("price_level").asInt();
                activity.setPriceLevel(priceLevel);
                activity.setEstimatedCost(mapPriceLevelToCost(priceLevel));
            }

            // Photo URL (get first photo if available)
            if (json.has("photos") && json.get("photos").isArray() && json.get("photos").size() > 0) {
                String photoReference = json.get("photos").get(0).get("photo_reference").asText();
                activity.setPhotoUrl(buildPhotoUrl(photoReference));
            }

            // Category (infer from types)
            if (json.has("types") && json.get("types").isArray()) {
                String category = inferCategoryFromTypes(json.get("types"));
                activity.setCategory(category);
            }

            // Set coordinates if available
            if (json.has("geometry") && json.get("geometry").has("location")) {
                JsonNode location = json.get("geometry").get("location");
                if (location.has("lat")) {
                    activity.setLatitude(BigDecimal.valueOf(location.get("lat").asDouble()));
                }
                if (location.has("lng")) {
                    activity.setLongitude(BigDecimal.valueOf(location.get("lng").asDouble()));
                }
            }

            // Set address from formatted_address
            if (json.has("formatted_address")) {
                activity.setAddress(json.get("formatted_address").asText());
            }

            // Set opening hours if available
            if (json.has("opening_hours")) {
                JsonNode hours = json.get("opening_hours");
                if (hours.has("weekday_text")) {
                    activity.setOpeningHours(hours.get("weekday_text").toString());
                }
            }

            // Set website if available
            if (json.has("website")) {
                activity.setWebsite(json.get("website").asText());
            }

            // Set phone if available
            if (json.has("formatted_phone_number")) {
                activity.setPhone(json.get("formatted_phone_number").asText());
            } else if (json.has("international_phone_number")) {
                activity.setPhone(json.get("international_phone_number").asText());
            }

            // Default duration estimates based on category
            activity.setDurationMinutes(getDefaultDurationForCategory(activity.getCategory()));
            activity.setEstimatedDuration(getDefaultDurationForCategory(activity.getCategory()));

            return activity;

        } catch (Exception e) {
            logger.error("Error parsing activity from JSON", e);
            return null;
        }
    }

    private double mapPriceLevelToCost(int priceLevel) {
        // Google price levels: 0 = Free, 1 = Inexpensive, 2 = Moderate, 3 = Expensive, 4 = Very Expensive
        switch (priceLevel) {
            case 0: return 0.0;
            case 1: return 15.0;
            case 2: return 35.0;
            case 3: return 65.0;
            case 4: return 100.0;
            default: return 25.0; // Default moderate cost
        }
    }

    private String buildPhotoUrl(String photoReference) {
        if (photoReference == null || photoReference.isEmpty()) {
            return null;
        }

        return UriComponentsBuilder.fromHttpUrl("https://maps.googleapis.com/maps/api/place/photo")
                .queryParam("maxwidth", "400")
                .queryParam("photoreference", photoReference)
                .queryParam("key", apiKey)
                .build()
                .toUriString();
    }

    private String inferCategoryFromTypes(JsonNode types) {
        // Map Google Place types to categories
        for (JsonNode type : types) {
            String typeStr = type.asText();
            switch (typeStr) {
                case "museum":
                case "art_gallery":
                    return "CULTURAL";
                case "amusement_park":
                case "zoo":
                case "aquarium":
                    return "ENTERTAINMENT";
                case "restaurant":
                case "food":
                case "meal_takeaway":
                    return "DINING";
                case "tourist_attraction":
                case "point_of_interest":
                    return "SIGHTSEEING";
                case "park":
                case "natural_feature":
                    return "OUTDOOR";
                case "shopping_mall":
                case "store":
                    return "SHOPPING";
            }
        }
        return "OTHER"; // Default category
    }

    private int getDefaultDurationForCategory(String category) {
        // Return duration in minutes based on category
        switch (category) {
            case "CULTURAL": return 180; // 3 hours for museums
            case "ENTERTAINMENT": return 240; // 4 hours for amusement parks
            case "DINING": return 90; // 1.5 hours for meals
            case "SIGHTSEEING": return 120; // 2 hours for sightseeing
            case "OUTDOOR": return 150; // 2.5 hours for parks
            case "SHOPPING": return 120; // 2 hours for shopping
            default: return 120; // 2 hours default
        }
    }
}