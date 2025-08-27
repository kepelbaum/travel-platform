package com.travelplatform.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.repository.DestinationRepository;
import com.travelplatform.backend.util.ActivityDurationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.*;

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

    @Value("${app.base-url}")
    private String baseUrl;

    @Autowired
    public GooglePlacesService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Search for activities/attractions for a specific destination
     */
    public List<Activity> searchActivitiesForDestination(Long destinationId, String type) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found: " + destinationId));

        String cityName = destination.getName();
        String country = destination.getCountry();
        Set<String> seenPlaceIds = new HashSet<>();
        List<Activity> allActivities = new ArrayList<>();

        // 4 targeted searches to get ~100 total diverse results
        List<String> queries = Arrays.asList(
                "must see attractions and places to visit in " + cityName + " " + country,
                "top restaurants and dining in " + cityName + " " + country,
                "best museums and cultural sites in " + cityName + " " + country,
                "popular parks and outdoor activities in " + cityName + " " + country
        );

        for (String query : queries) {
            List<Activity> results = performSingleSearch(query, destination);

            // Deduplicate by placeId
            for (Activity activity : results) {
                if (activity.getPlaceId() != null && !seenPlaceIds.contains(activity.getPlaceId())) {
                    allActivities.add(activity);
                    seenPlaceIds.add(activity.getPlaceId());
                }
            }

            try { Thread.sleep(200); } catch (InterruptedException e) { break; }
        }

        logger.info("Found {} total unique activities for {}", allActivities.size(), cityName);
        return allActivities;
    }

    /**
     * Get detailed information about a specific place
     */
    public Activity getPlaceDetails(String placeId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(PLACES_API_BASE_URL + PLACE_DETAILS_ENDPOINT)
                    .queryParam("place_id", placeId)
                    .queryParam("key", apiKey)
                    .queryParam("fields", "name,formatted_address,rating,price_level,photos,opening_hours,website,reviews,types,geometry,formatted_phone_number,international_phone_number,editorial_summary,user_ratings_total")
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

            if (json.has("name")) {
                logger.info("=== FIELDS FOR: {} ===", json.get("name").asText());
                json.fieldNames().forEachRemaining(field -> {
                    logger.info("  - {}: {}", field, json.get(field));
                });
            }

            String name = json.has("name") ? json.get("name").asText() : null;
            if (name == null || name.trim().isEmpty()) {
                logger.warn("Skipping activity with null/empty name: {}", json);
                return null; // Skip this activity
            }

            activity.setName(name);

            String description = null;

// Try editorial summary first
            if (json.has("editorial_summary") && json.get("editorial_summary").has("overview")) {
                description = json.get("editorial_summary").get("overview").asText();
            }

// Fallback to reviews if no editorial summary
//            else if (json.has("reviews") && json.get("reviews").isArray() && json.get("reviews").size() > 0) {
//                description = json.get("reviews").get(0).get("text").asText();
//            }

            else {
                description = "No description available.";
            }
            activity.setDescription(description);

            activity.setPlaceId(json.has("place_id") ? json.get("place_id").asText() : null);

            // Rating (keep as BigDecimal to match entity)
            if (json.has("rating")) {
                double googleRating = json.get("rating").asDouble();
                activity.setRating(BigDecimal.valueOf(googleRating));
            }

            if (json.has("user_ratings_total") && !json.get("user_ratings_total").isNull()) {
                activity.setUserRatingsTotal(json.get("user_ratings_total").asInt());
            } //added null safety

            // Get raw Google types first
            List<String> rawTypes = new ArrayList<>();
            if (json.has("types") && json.get("types").isArray()) {
                for (JsonNode type : json.get("types")) {
                    rawTypes.add(type.asText());
                }
            }

// Set duration using the first/primary raw type before normalization
            String primaryRawType = rawTypes.isEmpty() ? "custom" : rawTypes.get(0);
            activity.setDurationMinutes(ActivityDurationUtils.getDefaultDuration(primaryRawType));
            activity.setEstimatedDuration(ActivityDurationUtils.getDefaultDuration(primaryRawType));

// Then normalize category for display
            String category = "Other";
            if (json.has("types") && json.get("types").isArray()) {
                category = inferCategoryFromTypes(json.get("types"));
            }
            activity.setCategory(category);

            // Price level and estimated cost
            if (json.has("price_level")) {
                int priceLevel = json.get("price_level").asInt();
                activity.setPriceLevel(priceLevel);
                double cost = mapPriceLevelToCost(priceLevel);
                activity.setEstimatedCost(cost);
            } else {
                // Use NYC baseline category defaults when Google doesn't provide price_level
                double nycBaseCost = getDefaultCostByCategory(category);
                activity.setEstimatedCost(nycBaseCost);
            }

            // Photo URL (get first photo if available)
            if (json.has("photos") && json.get("photos").isArray() && json.get("photos").size() > 0) {
                String photoReference = json.get("photos").get(0).get("photo_reference").asText();
                activity.setPhotoUrl(baseUrl + "/api/activities/photo/" + photoReference);
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

            if (json.has("reviews") && json.get("reviews").isArray()) {
                JsonNode reviewsNode = json.get("reviews");
                logger.info("Found {} reviews for {}", reviewsNode.size(), name);

                // Store the entire reviews array as JSON string
                activity.setReviewsJson(reviewsNode.toString());
            } else {
                logger.info("No reviews found for {}", name);
                activity.setReviewsJson(null);
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

            return activity;

        } catch (Exception e) {
            logger.error("Error parsing activity from JSON", e);
            return null;
        }
    }

    public double mapPriceLevelToCost(int priceLevel) {
        // Google price levels: 0 = Free, 1 = Inexpensive, 2 = Moderate, 3 = Expensive, 4 = Very Expensive
        switch (priceLevel) {
            case 0: return 0.0;
            case 1: return 20.0;
            case 2: return 40.0;
            case 3: return 75.0;
            case 4: return 120.0;
            default: return 30.0;
        }
    }

    public String buildPhotoUrl(String photoReference) {
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
        // Map Google Place types to concise, user-friendly categories
        List<String> typeList = new ArrayList<>();
        for (JsonNode type : types) {
            typeList.add(type.asText());
        }

        // Check specific types FIRST
        if (typeList.contains("shopping_mall") || typeList.contains("department_store")) return "Shopping";

        if (typeList.contains("night_club") || typeList.contains("bar")) {
            return "Nightlife";
        }
        if (typeList.contains("museum") || typeList.contains("art_gallery")) {
            return "Museum";
        }
        if (typeList.contains("restaurant") || typeList.contains("meal_takeaway")) {
            return "Restaurant";
        }
        if (typeList.contains("park") || typeList.contains("natural_feature")) {
            return "Park";
        }
        if (typeList.contains("amusement_park") || typeList.contains("zoo") ||
                typeList.contains("aquarium") || typeList.contains("bowling_alley")) {
            return "Attraction";  // Fun/entertainment places
        }
        // Historic/iconic landmarks
        if (typeList.contains("place_of_worship") || typeList.contains("church") ||
                typeList.contains("synagogue") || typeList.contains("hindu_temple") ||
                typeList.contains("mosque") || typeList.contains("establishment")) {
            // Need to check by name for towers/landmarks vs regular establishments
            return "Landmark";  // Senso-ji, Eiffel Tower, Tokyo Tower
        }
        return "Other";
    }

    public List<Activity> searchSpecificActivities(Long destinationId, String searchTerm) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found: " + destinationId));

        String query = searchTerm + " in " + destination.getName();
        return performSingleSearch(query, destination);
    }

    public List<Activity> searchActivitiesByCategory(Long destinationId, String category) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new RuntimeException("Destination not found: " + destinationId));

        String categoryQuery = getCategorySearchQuery(category, destination.getName());
        return performSingleSearch(categoryQuery, destination);
    }

    private String getCategorySearchQuery(String category, String cityName) {
        switch (category.toLowerCase()) {
            case "museum": return "museums in " + cityName;
            case "restaurant": return "restaurants in " + cityName;
            case "park": return "parks in " + cityName;
            case "entertainment": return "entertainment in " + cityName;
            case "attraction": return "tourist attractions in " + cityName;
            default: return category + " in " + cityName;
        }
    }

    public List<Activity> performSingleSearch(String query, Destination destination) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(PLACES_API_BASE_URL + TEXT_SEARCH_ENDPOINT)
                .queryParam("query", query)
                .queryParam("key", apiKey)
                .queryParam("language", "en");

        // Add location bias if destination has coordinates
        if (destination.getLatitude() != null && destination.getLongitude() != null) {
            String location = destination.getLatitude() + "," + destination.getLongitude();
            builder.queryParam("location", location)
                    .queryParam("radius", "50000"); // 50km radius
        }

        String url = builder.build().toUriString();

        logger.info("=== GOOGLE PLACES QUERY: {} ===", query);
        logger.info("=== LOCATION BIAS: {},{} ===", destination.getLatitude(), destination.getLongitude());

        String response = restTemplate.getForObject(url, String.class);
        return parseActivitiesFromResponse(response);
    }

    private double getDefaultCostByCategory(String category) {
        // NYC baseline prices (1.0 multiplier)
        return switch (category.toLowerCase()) {
            case "museum" -> 20.0;
            case "restaurant", "nightlife" -> 45.0;
            case "park" -> 0.0;
            case "landmark" -> 15.0;
            case "attraction" -> 35.0;
            case "shopping" -> 40.0;
            default -> 25.0;
        };
    }

}