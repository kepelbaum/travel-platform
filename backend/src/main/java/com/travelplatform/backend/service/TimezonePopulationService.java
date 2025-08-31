package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.repository.DestinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TimezonePopulationService implements CommandLineRunner {

    @Autowired
    private DestinationRepository destinationRepository;

    // Map of cities from your cost multiplier service to their IANA timezone identifiers
    private static final Map<String, String> CITY_TIMEZONES = new HashMap<>();

    static {
        // Very High Cost Cities
        CITY_TIMEZONES.put("Zurich", "Europe/Zurich");
        CITY_TIMEZONES.put("Reykjavik", "Atlantic/Reykjavik");
        CITY_TIMEZONES.put("Singapore", "Asia/Singapore");

        // High Cost Cities
        CITY_TIMEZONES.put("New York", "America/New_York");
        CITY_TIMEZONES.put("San Francisco", "America/Los_Angeles");
        CITY_TIMEZONES.put("London", "Europe/London");
        CITY_TIMEZONES.put("Hong Kong", "Asia/Hong_Kong");
        CITY_TIMEZONES.put("Paris", "Europe/Paris");
        CITY_TIMEZONES.put("Tokyo", "Asia/Tokyo");

        // Moderately High Cost Cities
        CITY_TIMEZONES.put("Amsterdam", "Europe/Amsterdam");
        CITY_TIMEZONES.put("Sydney", "Australia/Sydney");
        CITY_TIMEZONES.put("Kyoto", "Asia/Tokyo");
        CITY_TIMEZONES.put("Vienna", "Europe/Vienna");
        CITY_TIMEZONES.put("Dubai", "Asia/Dubai");
        CITY_TIMEZONES.put("Montreal", "America/Toronto");
        CITY_TIMEZONES.put("Seoul", "Asia/Seoul");
        CITY_TIMEZONES.put("Jerusalem", "Asia/Jerusalem");
        CITY_TIMEZONES.put("Barcelona", "Europe/Madrid");
        CITY_TIMEZONES.put("Rome", "Europe/Rome");

        // Moderate Cost Cities
        CITY_TIMEZONES.put("Prague", "Europe/Prague");
        CITY_TIMEZONES.put("Berlin", "Europe/Berlin");
        CITY_TIMEZONES.put("Warsaw", "Europe/Warsaw");
        CITY_TIMEZONES.put("Athens", "Europe/Athens");

        // Lower Cost Cities
        CITY_TIMEZONES.put("Shanghai", "Asia/Shanghai");
        CITY_TIMEZONES.put("Moscow", "Europe/Moscow");
        CITY_TIMEZONES.put("Buenos Aires", "America/Argentina/Buenos_Aires");
        CITY_TIMEZONES.put("St. Petersburg", "Europe/Moscow");
        CITY_TIMEZONES.put("Cape Town", "Africa/Johannesburg");
        CITY_TIMEZONES.put("Istanbul", "Europe/Istanbul");
        CITY_TIMEZONES.put("Bangkok", "Asia/Bangkok");
    }

    @Override
    public void run(String... args) throws Exception {
        populateDestinationTimezones();
    }

    public void populateDestinationTimezones() {
        List<Destination> destinations = destinationRepository.findAll();
        int updated = 0;

        for (Destination destination : destinations) {
            if (destination.getTimezone() == null || destination.getTimezone().equals("UTC")) {
                String timezone = determineTimezone(destination);
                destination.setTimezone(timezone);
                destinationRepository.save(destination);
                updated++;

                System.out.println("Updated " + destination.getName() + " (" + destination.getName() +
                        ") to timezone: " + timezone);
            }
        }

        System.out.println("Updated " + updated + " destinations with timezone information");
    }

    private String determineTimezone(Destination destination) {
        String name = destination.getName();
        String country = destination.getCountry();

        // Direct city name match
        if (name != null && CITY_TIMEZONES.containsKey(name)) {
            return CITY_TIMEZONES.get(name);
        }

        // Country-based fallbacks for common countries
        if (country != null) {
            switch (country.toLowerCase()) {
                case "united states":
                case "usa":
                    return "America/New_York"; // Default to Eastern
                case "united kingdom":
                case "uk":
                    return "Europe/London";
                case "france":
                    return "Europe/Paris";
                case "germany":
                    return "Europe/Berlin";
                case "italy":
                    return "Europe/Rome";
                case "spain":
                    return "Europe/Madrid";
                case "japan":
                    return "Asia/Tokyo";
                case "australia":
                    return "Australia/Sydney";
                case "canada":
                    return "America/Toronto";
                case "switzerland":
                    return "Europe/Zurich";
                case "iceland":
                    return "Atlantic/Reykjavik";
                default:
                    return "UTC";
            }
        }

        return "UTC";
    }

    // Manual method we can call via API endpoint for testing
    @PostMapping("/admin/populate-timezones")
    public ResponseEntity<String> manualPopulate() {
        populateDestinationTimezones();
        return ResponseEntity.ok("Timezone population completed");
    }
}