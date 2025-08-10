package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.exception.ActivityNotFoundException;
import com.travelplatform.backend.service.ActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private DestinationRepository destinationRepository;

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
    }

    @Test
    void getActivitiesByDestination_ReturnsActivities() {
        List<Activity> expectedActivities = Arrays.asList(testActivity);
        when(activityRepository.findByDestinationId(1L)).thenReturn(expectedActivities);

        List<Activity> result = activityService.getActivitiesByDestination(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
        verify(activityRepository).findByDestinationId(1L);
    }

    @Test
    void createCustomActivity_SetsDefaultDurationWhenNotProvided() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
        when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Activity result = activityService.createCustomActivity(1L, "Test Museum", "museum", null, null, "A test museum");

        assertThat(result.getDurationMinutes()).isEqualTo(180); // Museum default
        assertEquals(1500.0, result.getEstimatedCost()); // Museum default cost
        assertThat(result.getIsCustom()).isTrue();
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void createCustomActivity_UsesProvidedDurationAndCost() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
        when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Activity result = activityService.createCustomActivity(1L, "Custom Activity", "custom", 240, 5000.0, "Custom description");

        assertThat(result.getDurationMinutes()).isEqualTo(240);
        assertEquals(5000.0, result.getEstimatedCost());
        assertThat(result.getDescription()).isEqualTo("Custom description");
    }

    @Test
    void createCustomActivity_ThrowsExceptionWhenDestinationNotFound() {
        when(destinationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.createCustomActivity(999L, "Test", "museum", null, null, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Destination not found with id: 999");

        verify(activityRepository, never()).save(any());
    }

    @Test
    void createFromGooglePlaces_SetsDefaultsForCategory() {
        when(destinationRepository.findById(1L)).thenReturn(Optional.of(testDestination));
        when(activityRepository.findByPlaceId("place123")).thenReturn(Optional.empty());
        when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Activity result = activityService.createFromGooglePlaces(1L, "place123", "Restaurant XYZ", "restaurant", "Great food");

        assertThat(result.getDurationMinutes()).isEqualTo(90); // Restaurant default
        assertEquals(3000.0, result.getEstimatedCost()); // Restaurant default cost
        assertThat(result.getIsCustom()).isFalse();
        assertThat(result.getPlaceId()).isEqualTo("place123");
    }

    @Test
    void createFromGooglePlaces_ReturnsExistingActivityIfPlaceIdExists() {
        Activity existingActivity = new Activity("Existing", "museum", testDestination);
        existingActivity.setPlaceId("place123");
        when(activityRepository.findByPlaceId("place123")).thenReturn(Optional.of(existingActivity));

        Activity result = activityService.createFromGooglePlaces(1L, "place123", "New Name", "museum", "Description");

        assertThat(result).isEqualTo(existingActivity);
        verify(activityRepository, never()).save(any());
    }

    @Test
    void updateActivity_UpdatesAllProvidedFields() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Activity result = activityService.updateActivity(1L, "Updated Name", "Updated desc", "museum", 200, 2500.0);

        assertThat(result.getName()).isEqualTo("Updated Name");
        assertThat(result.getDescription()).isEqualTo("Updated desc");
        assertThat(result.getCategory()).isEqualTo("museum");
        assertThat(result.getDurationMinutes()).isEqualTo(200);
        assertEquals(2500.0, result.getEstimatedCost());
    }

    @Test
    void updateActivity_ThrowsExceptionWhenActivityNotFound() {
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.updateActivity(999L, "Name", null, null, null, null))
                .isInstanceOf(ActivityNotFoundException.class)
                .hasMessageContaining("Activity not found with id: 999");
    }

    @Test
    void deleteActivity_DeletesWhenActivityExists() {
        when(activityRepository.existsById(1L)).thenReturn(true);

        activityService.deleteActivity(1L);

        verify(activityRepository).deleteById(1L);
    }

    @Test
    void deleteActivity_ThrowsExceptionWhenActivityNotFound() {
        when(activityRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> activityService.deleteActivity(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Activity not found with id: 999");

        verify(activityRepository, never()).deleteById(any());
    }

    @Test
    void searchActivities_ReturnsSearchResults() {
        List<Activity> expectedResults = Arrays.asList(testActivity);
        when(activityRepository.searchByDestinationAndTerm(1L, "tower")).thenReturn(expectedResults);

        List<Activity> result = activityService.searchActivities(1L, "tower");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Eiffel Tower");
        verify(activityRepository).searchByDestinationAndTerm(1L, "tower");
    }
}