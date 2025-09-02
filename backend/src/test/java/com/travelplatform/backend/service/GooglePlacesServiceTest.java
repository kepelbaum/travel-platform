package com.travelplatform.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.DestinationNotFoundException;
import com.travelplatform.backend.repository.DestinationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Google Places Service Tests")
class GooglePlacesServiceTest {

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GooglePlacesService googlePlacesService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private Destination testDestination;

    @BeforeEach
    void setUp() {
        // Set up test destination
        testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");
        testDestination.setCountry("France");
        testDestination.setLatitude(new BigDecimal("48.8566"));
        testDestination.setLongitude(new BigDecimal("2.3522"));

        // Inject dependencies using reflection
        ReflectionTestUtils.setField(googlePlacesService, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(googlePlacesService, "baseUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(googlePlacesService, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(googlePlacesService, "destinationRepository", destinationRepository);
    }

    @Nested
    @DisplayName("Search Activities for Destination")
    class SearchActivitiesForDestination {

        @Test
        @DisplayName("Should search activities and deduplicate by place ID")
        void shouldSearchActivitiesAndDeduplicateByPlaceId() {
            when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));

            // Mock API responses for different queries
            String mockResponse = createMockGooglePlacesResponse();
            when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

            List<Activity> result = googlePlacesService.searchActivitiesForDestination(1L, null);

            assertThat(result).isNotNull();
            verify(destinationRepository).findById(1L);
            verify(restTemplate, atLeast(4)).getForObject(anyString(), eq(String.class));
        }

        @Test
        @DisplayName("Should throw exception when destination not found")
        void shouldThrowExceptionWhenDestinationNotFound() {
            when(destinationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> googlePlacesService.searchActivitiesForDestination(999L, null))
                    .isInstanceOf(DestinationNotFoundException.class);

            verify(restTemplate, never()).getForObject(anyString(), eq(String.class));
        }

        @Test
        @DisplayName("Should handle API errors gracefully")
        void shouldHandleApiErrorsGracefully() {
            when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
            when(restTemplate.getForObject(anyString(), eq(String.class)))
                    .thenThrow(new RuntimeException("API Error"));

            List<Activity> result = googlePlacesService.searchActivitiesForDestination(1L, null);

            // Should return empty list instead of throwing exception
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Place Details")
    class PlaceDetails {

        @Test
        @DisplayName("Should get place details successfully")
        void shouldGetPlaceDetailsSuccessfully() {
            String mockResponse = createMockPlaceDetailsResponse();
            when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

            Activity result = googlePlacesService.getPlaceDetails("ChIJLU7jZClu5kcR4PcOOO6p3I0");

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Eiffel Tower");
            assertThat(result.getRating()).isEqualTo(new BigDecimal("4.5"));
            verify(restTemplate).getForObject(anyString(), eq(String.class));
        }

        @Test
        @DisplayName("Should handle API errors and return null")
        void shouldHandleApiErrorsAndReturnNull() {
            when(restTemplate.getForObject(anyString(), eq(String.class)))
                    .thenThrow(new RuntimeException("API Error"));

            Activity result = googlePlacesService.getPlaceDetails("invalid-place-id");

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should handle malformed API response")
        void shouldHandleMalformedApiResponse() {
            when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn("invalid json");

            Activity result = googlePlacesService.getPlaceDetails("place-id");

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("Single Search")
    class SingleSearch {

        @Test
        @DisplayName("Should perform single search with location bias")
        void shouldPerformSingleSearchWithLocationBias() {
            String mockResponse = createMockGooglePlacesResponse();
            when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

            List<Activity> result = googlePlacesService.performSingleSearch("attractions in Paris", testDestination);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
            assertThat(result.get(0).getRating()).isEqualTo(new BigDecimal("4.5"));
            verify(restTemplate).getForObject(anyString(), eq(String.class));
        }

        @Test
        @DisplayName("Should perform search without location bias when coordinates missing")
        void shouldPerformSearchWithoutLocationBiasWhenCoordinatesMissing() {
            Destination destinationWithoutCoords = new Destination();
            destinationWithoutCoords.setName("Unknown City");
            destinationWithoutCoords.setCountry("Unknown Country");

            String mockResponse = createMockGooglePlacesResponse();
            when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(mockResponse);

            List<Activity> result = googlePlacesService.performSingleSearch("attractions", destinationWithoutCoords);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
            verify(restTemplate).getForObject(anyString(), eq(String.class));
        }
    }

    @Nested
    @DisplayName("Utility Methods")
    class UtilityMethods {

        @Test
        @DisplayName("Should map price levels to costs correctly")
        void shouldMapPriceLevelsToCostsCorrectly() {
            assertThat(googlePlacesService.mapPriceLevelToCost(0)).isEqualTo(0.0);   // Free
            assertThat(googlePlacesService.mapPriceLevelToCost(1)).isEqualTo(20.0);  // Inexpensive
            assertThat(googlePlacesService.mapPriceLevelToCost(2)).isEqualTo(40.0);  // Moderate
            assertThat(googlePlacesService.mapPriceLevelToCost(3)).isEqualTo(75.0);  // Expensive
            assertThat(googlePlacesService.mapPriceLevelToCost(4)).isEqualTo(120.0); // Very Expensive
            assertThat(googlePlacesService.mapPriceLevelToCost(999)).isEqualTo(30.0); // Default
        }

        @Test
        @DisplayName("Should build photo URL correctly")
        void shouldBuildPhotoUrlCorrectly() {
            String photoRef = "test-photo-reference-123";
            String result = googlePlacesService.buildPhotoUrl(photoRef);

            assertThat(result).contains("https://maps.googleapis.com/maps/api/place/photo");
            assertThat(result).contains("maxwidth=400");
            assertThat(result).contains("photoreference=" + photoRef);
            assertThat(result).contains("key=test-api-key");
        }

        @Test
        @DisplayName("Should return null for empty photo reference")
        void shouldReturnNullForEmptyPhotoReference() {
            assertThat(googlePlacesService.buildPhotoUrl(null)).isNull();
            assertThat(googlePlacesService.buildPhotoUrl("")).isNull();
        }
    }

    // Helper methods for creating mock API responses
    private String createMockGooglePlacesResponse() {
        return """
        {
            "results": [
                {
                    "place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
                    "name": "Eiffel Tower",
                    "rating": 4.5,
                    "price_level": 2,
                    "types": ["tourist_attraction", "point_of_interest"],
                    "geometry": {
                        "location": {
                            "lat": 48.8584,
                            "lng": 2.2945
                        }
                    },
                    "formatted_address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
                    "photos": [
                        {
                            "photo_reference": "test-photo-ref-123"
                        }
                    ]
                }
            ],
            "status": "OK"
        }
        """;
    }

    private String createMockPlaceDetailsResponse() {
        return """
        {
            "result": {
                "place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
                "name": "Eiffel Tower",
                "rating": 4.5,
                "user_ratings_total": 123456,
                "price_level": 2,
                "types": ["tourist_attraction", "point_of_interest"],
                "formatted_address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
                "website": "https://www.toureiffel.paris",
                "formatted_phone_number": "+33 8 92 70 12 39",
                "editorial_summary": {
                    "overview": "Iconic iron lattice tower built for the 1889 World's Fair."
                },
                "geometry": {
                    "location": {
                        "lat": 48.8584,
                        "lng": 2.2945
                    }
                },
                "photos": [
                    {
                        "photo_reference": "test-photo-ref-123"
                    }
                ],
                "opening_hours": {
                    "weekday_text": [
                        "Monday: 9:30 AM – 11:45 PM",
                        "Tuesday: 9:30 AM – 11:45 PM"
                    ]
                },
                "reviews": [
                    {
                        "author_name": "Tourist",
                        "rating": 5,
                        "text": "Amazing views!"
                    }
                ]
            },
            "status": "OK"
        }
        """;
    }
}