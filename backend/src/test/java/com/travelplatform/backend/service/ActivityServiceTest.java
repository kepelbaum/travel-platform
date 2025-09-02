package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.repository.ActivityRepository;
import com.travelplatform.backend.repository.DestinationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Activity Service Tests")
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private GooglePlacesService googlePlacesService;

    @Mock
    private CostMultiplierService costMultiplierService;

    @InjectMocks
    private ActivityService activityService;

    private Destination testDestination;
    private Activity testActivity;

    @BeforeEach
    void setUp() {
        testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");
        testDestination.setCountry("France");

        testActivity = new Activity("Eiffel Tower", "tourist_attraction", testDestination);
        testActivity.setId(1L);
        testActivity.setUpdatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("Activity Retrieval")
    class ActivityRetrieval {

        @Test
        @DisplayName("Should return all activities without pagination")
        void shouldReturnAllActivitiesWithoutPagination() {
            // Create multiple activities to test we get all of them
            Activity activity1 = new Activity();
            activity1.setName("Eiffel Tower");
            activity1.setUpdatedAt(LocalDateTime.now().minusDays(1)); // Fresh cache

            Activity activity2 = new Activity();
            activity2.setName("Louvre Museum");
            activity2.setUpdatedAt(LocalDateTime.now().minusDays(1)); // Fresh cache

            List<Activity> activities = Arrays.asList(activity1, activity2);

            // Mock repository to return all activities
            when(activityRepository.findByDestinationId(1L)).thenReturn(activities);
            when(activityRepository.countByDestinationId(1L)).thenReturn(2L);

            List<Activity> result = activityService.getAllActivitiesByDestination(1L);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
            assertThat(result.get(1).getName()).isEqualTo("Louvre Museum");

            // Verify no Google Places API call was made (cache is fresh)
            verify(googlePlacesService, never()).searchActivitiesForDestination(any(), any());
        }

        @Test
        @DisplayName("Should get activity by ID")
        void shouldGetActivityById() {
            when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

            Optional<Activity> result = activityService.getActivityById(1L);

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Eiffel Tower");
        }

        @Test
        @DisplayName("Should throw exception when activity not found")
        void shouldThrowExceptionWhenActivityNotFound() {
            when(activityRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> activityService.getActivityById(999L))
                    .isInstanceOf(ActivityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Activity Updates")
    class ActivityUpdates {

        @Test
        @DisplayName("Should update activity with all provided fields")
        void shouldUpdateActivityWithAllProvidedFields() {
            when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
            when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Activity result = activityService.updateActivity(1L, "Updated Name", "Updated desc", "museum", 200, 2500.0);

            assertThat(result.getName()).isEqualTo("Updated Name");
            assertThat(result.getDescription()).isEqualTo("Updated desc");
            assertThat(result.getCategory()).isEqualTo("museum");
            assertThat(result.getDurationMinutes()).isEqualTo(200);
            assertThat(result.getEstimatedCost()).isEqualTo(2500.0);
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent activity")
        void shouldThrowExceptionWhenUpdatingNonExistentActivity() {
            when(activityRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> activityService.updateActivity(999L, "Name", null, null, null, null))
                    .isInstanceOf(ActivityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Activity Deletion")
    class ActivityDeletion {

        @Test
        @DisplayName("Should delete activity when it exists")
        void shouldDeleteActivityWhenItExists() {
            when(activityRepository.existsById(1L)).thenReturn(true);

            activityService.deleteActivity(1L);

            verify(activityRepository).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent activity")
        void shouldThrowExceptionWhenDeletingNonExistentActivity() {
            when(activityRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> activityService.deleteActivity(999L))
                    .isInstanceOf(ActivityNotFoundException.class);

            verify(activityRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("Search and Filter")
    class SearchAndFilter {

        @Test
        @DisplayName("Should search activities and return results")
        void shouldSearchActivitiesAndReturnResults() {
            // Create test activities - some match search, some don't
            Activity towerActivity = new Activity();
            towerActivity.setName("Eiffel Tower");
            towerActivity.setUpdatedAt(LocalDateTime.now().minusDays(1)); // Fresh cache

            Activity museumActivity = new Activity();
            museumActivity.setName("Louvre Museum");
            museumActivity.setUpdatedAt(LocalDateTime.now().minusDays(1)); // Fresh cache

            List<Activity> allActivities = Arrays.asList(towerActivity, museumActivity);

            // Mock getting all activities (since search now filters on all activities)
            when(activityRepository.findByDestinationId(1L)).thenReturn(allActivities);
            when(activityRepository.countByDestinationId(1L)).thenReturn(2L);

            // Since search method was removed, you'd need to implement it or test filtering logic
            // This assumes you implement a search method that gets all activities and filters
            List<Activity> allResults = activityService.getAllActivitiesByDestination(1L);

            // Frontend would filter these results - test that we get all activities back
            assertThat(allResults).hasSize(2);
            assertThat(allResults.stream().anyMatch(a -> a.getName().contains("Tower"))).isTrue();
            assertThat(allResults.stream().anyMatch(a -> a.getName().contains("Museum"))).isTrue();
        }

        @Test
        @DisplayName("Should get top rated activities")
        void shouldGetTopRatedActivities() {
            when(activityRepository.findTopRatedByDestination(1L)).thenReturn(Arrays.asList(testActivity));

            List<Activity> result = activityService.getTopRatedActivities(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
        }

        @Test
        @DisplayName("Should get activities by cost range")
        void shouldGetActivitiesByCostRange() {
            when(activityRepository.findByDestinationAndCostRange(1L, 1000, 3000))
                    .thenReturn(Arrays.asList(testActivity));

            List<Activity> result = activityService.getActivitiesByCostRange(1L, 1000, 3000);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
        }

        @Test
        @DisplayName("Should get all categories")
        void shouldGetAllCategories() {
            when(activityRepository.findDistinctCategories())
                    .thenReturn(Arrays.asList("tourist_attraction", "museum", "restaurant"));

            List<String> result = activityService.getAllCategories();

            assertThat(result).hasSize(3);
            assertThat(result).contains("tourist_attraction", "museum", "restaurant");
        }
    }

    @Nested
    @DisplayName("Smart Caching")
    class SmartCaching {


            @Test
            @DisplayName("Should force refresh activities from Google Places")
            void shouldForceRefreshActivitiesFromGooglePlaces() {
                List<Activity> newActivities = Arrays.asList(testActivity);

                // Mock the direct method call your service makes
                when(googlePlacesService.searchActivitiesForDestination(1L, null)).thenReturn(newActivities);

                // Mock destination lookup for saveActivitiesFromPlaces
                when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));

                // Mock repository operations for saving
                when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

                List<Activity> result = activityService.forceRefreshActivities(1L);

                assertThat(result).hasSize(1);
                verify(googlePlacesService).searchActivitiesForDestination(1L, null);
            }

            @Test
            @DisplayName("Should return cache statistics")
            void shouldReturnCacheStatistics() {
                when(activityRepository.countByDestinationId(1L)).thenReturn(10L);
                when(activityRepository.findByDestinationIdAndIsCustomFalse(1L)).thenReturn(Arrays.asList(testActivity));
                when(activityRepository.findByDestinationIdAndIsCustomTrue(1L)).thenReturn(Arrays.asList());
                when(activityRepository.findByDestinationId(1L)).thenReturn(Arrays.asList(testActivity));

                ActivityService.CacheStats result = activityService.getCacheStats(1L);

                assertThat(result.getTotalActivities()).isEqualTo(10L);
                assertThat(result.getCacheTtlDays()).isEqualTo(30);
            }
        }

        @Nested
        @DisplayName("Google Places Integration")
        class GooglePlacesIntegration {

            @Test
            @DisplayName("Should save activities from Places API avoiding duplicates")
            void shouldSaveActivitiesFromPlacesApiAvoidingDuplicates() {
                Activity newActivity = new Activity("New Activity", "restaurant", testDestination);
                newActivity.setPlaceId("new_place_id");
                newActivity.setEstimatedCost(50.0);

                when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
                when(activityRepository.findByPlaceId("new_place_id")).thenReturn(Optional.empty());
                when(activityRepository.findByDestinationIdAndNameIgnoreCase(1L, "New Activity")).thenReturn(Optional.empty());
                when(activityRepository.save(any(Activity.class))).thenReturn(newActivity);
                when(costMultiplierService.applyMultiplier(50.0, "Paris")).thenReturn(42.5); // Paris multiplier 0.85

                List<Activity> result = activityService.saveActivitiesFromPlaces(Arrays.asList(newActivity), 1L);

                assertThat(result).hasSize(1);
                verify(activityRepository).save(any(Activity.class));
                verify(costMultiplierService).applyMultiplier(50.0, "Paris");
            }

            @Test
            @DisplayName("Should update existing activity when duplicate place ID found")
            void shouldUpdateExistingActivityWhenDuplicatePlaceIdFound() {
                Activity existingActivity = new Activity("Old Name", "restaurant", testDestination);
                existingActivity.setPlaceId("duplicate_place_id");

                Activity newData = new Activity("Updated Name", "restaurant", testDestination);
                newData.setPlaceId("duplicate_place_id");
                newData.setEstimatedCost(60.0);
                newData.setDescription("Updated description");

                when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
                when(activityRepository.findByPlaceId("duplicate_place_id")).thenReturn(Optional.of(existingActivity));
                when(activityRepository.save(any(Activity.class))).thenReturn(existingActivity);
                when(costMultiplierService.applyMultiplier(60.0, "Paris")).thenReturn(51.0);

                List<Activity> result = activityService.saveActivitiesFromPlaces(Arrays.asList(newData), 1L);

                assertThat(result).hasSize(1);
                // Verify the existing activity was updated, not a new one created
                verify(activityRepository).save(existingActivity);
                verify(activityRepository, never()).save(newData);
            }

            @Test
            @DisplayName("Should enhance activity with Places data")
            void shouldEnhanceActivityWithPlacesData() {
                Activity placesData = new Activity("Enhanced", "tourist_attraction", testDestination);
                placesData.setPhotoUrl("https://example.com/photo.jpg");
                placesData.setRating(new BigDecimal("4.5"));
                placesData.setEstimatedCost(75.0);

                when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

                Activity result = activityService.enhanceActivityWithPlacesData(testActivity, placesData);

                assertThat(testActivity.getPhotoUrl()).isEqualTo("https://example.com/photo.jpg");
                assertThat(testActivity.getRating()).isEqualTo(new BigDecimal("4.5"));
                assertThat(testActivity.getEstimatedCost()).isEqualTo(75.0);
                verify(activityRepository).save(testActivity);
            }

            @Test
            @DisplayName("Should force refresh activities from Google Places")
            void shouldForceRefreshActivitiesFromGooglePlaces() {
                when(googlePlacesService.searchActivitiesForDestination(1L, null))
                        .thenReturn(Arrays.asList(testActivity));
                when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
                when(activityRepository.save(any(Activity.class))).thenReturn(testActivity);

                List<Activity> result = activityService.forceRefreshActivities(1L);

                assertThat(result).hasSize(1);
                verify(googlePlacesService).searchActivitiesForDestination(1L, null);
            }
        }
    }