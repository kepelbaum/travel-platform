package com.travelplatform.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travelplatform.backend.config.GlobalExceptionHandler;
import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.service.ActivityService;
import com.travelplatform.backend.service.GooglePlacesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Activity Controller Tests")
class ActivityControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ActivityService activityService;

    @Mock
    private GooglePlacesService googlePlacesService;

    @InjectMocks
    private ActivityController activityController;

    private Activity testActivity;
    private Destination testDestination;
    private ActivityService.CacheStats mockCacheStats;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mockMvc = MockMvcBuilders.standaloneSetup(activityController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        setupTestData();
    }

    private void setupTestData() {
        testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");

        testActivity = new Activity("Eiffel Tower", "tourist_attraction", testDestination);
        testActivity.setId(1L);
        testActivity.setDurationMinutes(120);
        testActivity.setEstimatedCost(2000.0);
        testActivity.setPlaceId("ChIJLU7jZClu5kcR4PcOOO6p3I0");
        testActivity.setRating(BigDecimal.valueOf(4.5));
        testActivity.setPhotoUrl("https://example.com/photo.jpg");

        mockCacheStats = new ActivityService.CacheStats(
                1L, 1L, 0L, LocalDateTime.now(), false, 7
        );
    }

    @Nested
    @DisplayName("Get Activities by Destination")
    class GetActivitiesByDestination {

        @Test
        @DisplayName("Should return all activities for destination")
        void shouldReturnAllActivitiesForDestination() throws Exception {
            List<Activity> allActivities = Arrays.asList(testActivity);
            when(activityService.getAllActivitiesByDestination(1L)).thenReturn(allActivities);
            when(activityService.getCacheStats(1L)).thenReturn(mockCacheStats);

            mockMvc.perform(get("/api/activities/destination/1"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.activities").isArray())
                    .andExpect(jsonPath("$.activities[0].name").value("Eiffel Tower"))
                    .andExpect(jsonPath("$.activities[0].category").value("tourist_attraction"))
                    .andExpect(jsonPath("$.count").value(1))
                    .andExpect(jsonPath("$.source").value("database_cached"));

            verify(activityService).getAllActivitiesByDestination(1L);
        }

        @Test
        @DisplayName("Should handle service exceptions gracefully")
        void shouldHandleServiceExceptionsGracefully() throws Exception {
            when(activityService.getAllActivitiesByDestination(1L))
                    .thenThrow(new RuntimeException("Database error"));

            mockMvc.perform(get("/api/activities/destination/1"))
                    .andExpect(status().isInternalServerError());
        }
    }

    @Nested
    @DisplayName("Get Activity by ID")
    class GetActivityById {

        @Test
        @DisplayName("Should return activity when found")
        void shouldReturnActivityWhenFound() throws Exception {
            when(activityService.getActivityById(1L)).thenReturn(Optional.of(testActivity));

            mockMvc.perform(get("/api/activities/1"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.name").value("Eiffel Tower"))
                    .andExpect(jsonPath("$.durationMinutes").value(120))
                    .andExpect(jsonPath("$.rating").value(4.5));
        }

        @Test
        @DisplayName("Should return 404 when activity not found")
        void shouldReturn404WhenActivityNotFound() throws Exception {
            when(activityService.getActivityById(999L)).thenReturn(Optional.empty());

            mockMvc.perform(get("/api/activities/999"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should enhance activity with Places data when missing information")
        void shouldEnhanceActivityWithPlacesDataWhenMissingInformation() throws Exception {
            Activity incompleteActivity = new Activity("Test Activity", "restaurant", testDestination);
            incompleteActivity.setId(1L);
            incompleteActivity.setPlaceId("test_place_id");

            Activity enhancedActivity = new Activity("Test Activity", "restaurant", testDestination);
            enhancedActivity.setId(1L);
            enhancedActivity.setPhotoUrl("https://example.com/photo.jpg");
            enhancedActivity.setRating(BigDecimal.valueOf(4.2));

            when(activityService.getActivityById(1L)).thenReturn(Optional.of(incompleteActivity));
            when(googlePlacesService.getPlaceDetails("test_place_id")).thenReturn(enhancedActivity);
            when(activityService.enhanceActivityWithPlacesData(incompleteActivity, enhancedActivity))
                    .thenReturn(enhancedActivity);

            mockMvc.perform(get("/api/activities/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.photoUrl").value("https://example.com/photo.jpg"))
                    .andExpect(jsonPath("$.rating").value(4.2));

            verify(googlePlacesService).getPlaceDetails("test_place_id");
            verify(activityService).enhanceActivityWithPlacesData(incompleteActivity, enhancedActivity);
        }
    }

    @Nested
    @DisplayName("Google Places Integration")
    class GooglePlacesIntegration {

        @Test
        @DisplayName("Should return cached activities when not forcing refresh")
        void shouldReturnCachedActivitiesWhenNotForcingRefresh() throws Exception {
            List<Activity> cachedActivities = Arrays.asList(testActivity);
            when(activityService.getAllActivitiesByDestination(1L)).thenReturn(cachedActivities);

            mockMvc.perform(get("/api/activities/destination/1/places-search"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.activities").isArray())
                    .andExpect(jsonPath("$.source").value("cached"));

            verify(activityService).getAllActivitiesByDestination(1L);
        }

        @Test
        @DisplayName("Should force refresh from Google Places when requested")
        void shouldForceRefreshFromGooglePlacesWhenRequested() throws Exception {
            List<Activity> refreshedActivities = Arrays.asList(testActivity);
            when(googlePlacesService.searchActivitiesForDestination(1L, null)).thenReturn(refreshedActivities);
            when(activityService.saveActivitiesFromPlaces(refreshedActivities, 1L)).thenReturn(refreshedActivities);

            mockMvc.perform(get("/api/activities/destination/1/places-search")
                            .param("forceRefresh", "true"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.source").value("google_places"));

            verify(googlePlacesService).searchActivitiesForDestination(1L, null);
            verify(activityService).saveActivitiesFromPlaces(refreshedActivities, 1L);
        }

        @Test
        @DisplayName("Should refresh activity from Places data")
        void shouldRefreshActivityFromPlacesData() throws Exception {
            Activity enhancedActivity = new Activity("Enhanced Tower", "tourist_attraction", testDestination);
            enhancedActivity.setRating(BigDecimal.valueOf(4.8));

            when(activityService.getActivityById(1L)).thenReturn(Optional.of(testActivity));
            when(googlePlacesService.getPlaceDetails("ChIJLU7jZClu5kcR4PcOOO6p3I0")).thenReturn(enhancedActivity);
            when(activityService.enhanceActivityWithPlacesData(testActivity, enhancedActivity))
                    .thenReturn(enhancedActivity);

            mockMvc.perform(post("/api/activities/1/refresh-places-data"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.rating").value(4.8));

            verify(googlePlacesService).getPlaceDetails("ChIJLU7jZClu5kcR4PcOOO6p3I0");
        }

        @Test
        @DisplayName("Should return 400 when activity has no place ID")
        void shouldReturn400WhenActivityHasNoPlaceId() throws Exception {
            Activity activityWithoutPlaceId = new Activity("No Place ID", "restaurant", testDestination);
            activityWithoutPlaceId.setId(1L);

            when(activityService.getActivityById(1L)).thenReturn(Optional.of(activityWithoutPlaceId));

            mockMvc.perform(post("/api/activities/1/refresh-places-data"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Activity Management")
    class ActivityManagement {

        @Test
        @DisplayName("Should update activity successfully")
        void shouldUpdateActivitySuccessfully() throws Exception {
            Activity updatedActivity = new Activity("Updated Tower", "tourist_attraction", testDestination);
            updatedActivity.setId(1L);

            when(activityService.updateActivity(eq(1L), eq("Updated Tower"), isNull(), isNull(), isNull(), isNull()))
                    .thenReturn(updatedActivity);

            mockMvc.perform(put("/api/activities/1")
                            .param("name", "Updated Tower"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Tower"));

            verify(activityService).updateActivity(eq(1L), eq("Updated Tower"), isNull(), isNull(), isNull(), isNull());
        }

        @Test
        @DisplayName("Should return 404 when updating non-existent activity")
        void shouldReturn404WhenUpdatingNonExistentActivity() throws Exception {
            when(activityService.updateActivity(any(), any(), any(), any(), any(), any()))
                    .thenThrow(new ActivityNotFoundException(999L));

            mockMvc.perform(put("/api/activities/999")
                            .param("name", "Updated Name"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should delete activity successfully")
        void shouldDeleteActivitySuccessfully() throws Exception {
            mockMvc.perform(delete("/api/activities/1"))
                    .andExpect(status().isNoContent());

            verify(activityService).deleteActivity(1L);
        }

        @Test
        @DisplayName("Should return 404 when deleting non-existent activity")
        void shouldReturn404WhenDeletingNonExistentActivity() throws Exception {
            doThrow(new ActivityNotFoundException(999L))
                    .when(activityService).deleteActivity(999L);

            mockMvc.perform(delete("/api/activities/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Utility Endpoints")
    class UtilityEndpoints {

        @Test
        @DisplayName("Should return activity count for destination")
        void shouldReturnActivityCountForDestination() throws Exception {
            when(activityService.getActivityCount(1L)).thenReturn(5L);

            mockMvc.perform(get("/api/activities/destination/1/count"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(5));
        }

        @Test
        @DisplayName("Should return all activity categories")
        void shouldReturnAllActivityCategories() throws Exception {
            List<String> categories = Arrays.asList("tourist_attraction", "restaurant", "museum");
            when(activityService.getAllCategories()).thenReturn(categories);

            mockMvc.perform(get("/api/activities/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0]").value("tourist_attraction"));
        }

        @Test
        @DisplayName("Should return top rated activities")
        void shouldReturnTopRatedActivities() throws Exception {
            List<Activity> topRated = Arrays.asList(testActivity);
            when(activityService.getTopRatedActivities(1L)).thenReturn(topRated);

            mockMvc.perform(get("/api/activities/destination/1/top-rated"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].name").value("Eiffel Tower"));
        }

        @Test
        @DisplayName("Should return activities by cost range")
        void shouldReturnActivitiesByCostRange() throws Exception {
            List<Activity> costRangeActivities = Arrays.asList(testActivity);
            when(activityService.getActivitiesByCostRange(1L, 1000, 3000)).thenReturn(costRangeActivities);

            mockMvc.perform(get("/api/activities/destination/1/cost-range")
                            .param("minCost", "1000")
                            .param("maxCost", "3000"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].estimatedCost").value(2000.0));
        }

        @Test
        @DisplayName("Should return health check status")
        void shouldReturnHealthCheckStatus() throws Exception {
            mockMvc.perform(get("/api/activities/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("healthy"))
                    .andExpect(jsonPath("$.google_places_api").value("configured"));
        }
    }

    @Nested
    @DisplayName("Smart Caching Features")
    class SmartCachingFeatures {

        @Test
        @DisplayName("Should force refresh activities and clear cache")
        void shouldForceRefreshActivitiesAndClearCache() throws Exception {
            List<Activity> refreshedActivities = Arrays.asList(testActivity);
            when(activityService.forceRefreshActivities(1L)).thenReturn(refreshedActivities);

            mockMvc.perform(post("/api/activities/destination/1/refresh"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.source").value("google_places_refreshed"))
                    .andExpect(jsonPath("$.message").value("Cache cleared and refreshed from Google Places API"));

            verify(activityService).forceRefreshActivities(1L);
        }

        @Test
        @DisplayName("Should return cache statistics")
        void shouldReturnCacheStatistics() throws Exception {
            when(activityService.getCacheStats(1L)).thenReturn(mockCacheStats);

            mockMvc.perform(get("/api/activities/destination/1/cache-stats"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalActivities").value(1))
                    .andExpect(jsonPath("$.cacheStale").value(false))
                    .andExpect(jsonPath("$.cacheTtlDays").value(7));
        }

        @Test
        @DisplayName("Should return smart cached activities with statistics")
        void shouldReturnSmartCachedActivitiesWithStatistics() throws Exception {
            List<Activity> allActivities = Arrays.asList(testActivity);
            when(activityService.getAllActivitiesByDestination(1L)).thenReturn(allActivities);
            when(activityService.getCacheStats(1L)).thenReturn(mockCacheStats);

            mockMvc.perform(get("/api/activities/destination/1/smart"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.activities").isArray())
                    .andExpect(jsonPath("$.source").value("database_cached"))
                    .andExpect(jsonPath("$.cacheStats.totalActivities").value(1))
                    .andExpect(jsonPath("$.cacheStats.isCacheStale").value(false));
        }
    }
}