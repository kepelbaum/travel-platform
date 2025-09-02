package com.travelplatform.backend.service;

import com.travelplatform.backend.entity.*;
import com.travelplatform.backend.exception.*;
import com.travelplatform.backend.repository.ActivityRepository;
import com.travelplatform.backend.repository.TripActivityRepository;
import com.travelplatform.backend.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TripActivity Service Tests")
class TripActivityServiceTest {

    @Mock
    private TripActivityRepository tripActivityRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private TripActivityService tripActivityService;

    private Trip testTrip;
    private Activity testActivity;
    private TripActivity testTripActivity;
    private Destination testDestination;

    @BeforeEach
    void setUp() {
        User testUser = new User("John", "john@test.com", "password");
        testUser.setId(1L);

        testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");
        testDestination.setCountry("France");
        testDestination.setTimezone("Europe/Paris");

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setName("Paris Trip");
        testTrip.setUser(testUser);
        testTrip.setStartDate(LocalDate.of(2026, 3, 15));
        testTrip.setEndDate(LocalDate.of(2026, 3, 20));
        testTrip.setDestinations(Arrays.asList(testDestination));

        testActivity = new Activity("Eiffel Tower", "tourist_attraction", testDestination);
        testActivity.setId(1L);
        testActivity.setDurationMinutes(120);

        testTripActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");
        testTripActivity.setId(1L);
    }

    @Nested
    @DisplayName("Schedule Activities")
    class ScheduleActivities {

        @Test
        @DisplayName("Should schedule activity successfully without conflicts")
        void shouldScheduleActivitySuccessfullyWithoutConflicts() {
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Collections.emptyList()); // No existing activities = no conflicts
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Test notes");

            assertThat(result.getTrip()).isEqualTo(testTrip);
            assertThat(result.getActivity()).isEqualTo(testActivity);
            assertThat(result.getPlannedDate()).isEqualTo(LocalDate.of(2026, 3, 15));
            assertThat(result.getStartTime()).isEqualTo(LocalTime.of(10, 0));
            assertThat(result.getDurationMinutes()).isEqualTo(120);
            assertThat(result.getTimezone()).isEqualTo("Europe/Paris");
            assertThat(result.getNotes()).isEqualTo("Test notes");
            verify(tripActivityRepository).save(any(TripActivity.class));
        }

        @Test
        @DisplayName("Should use activity default duration when not provided")
        void shouldUseActivityDefaultDurationWhenNotProvided() {
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Collections.emptyList());
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), null, null);

            assertThat(result.getDurationMinutes()).isEqualTo(120); // From testActivity.getDurationMinutes()
        }

        @Test
        @DisplayName("Should throw exception when trip not found")
        void shouldThrowExceptionWhenTripNotFound() {
            when(tripRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> tripActivityService.scheduleActivity(999L, 1L, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, null))
                    .isInstanceOf(TripNotFoundException.class)
                    .hasMessageContaining("Trip not found with id: 999");

            verify(tripActivityRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when activity not found")
        void shouldThrowExceptionWhenActivityNotFound() {
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 999L, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, null))
                    .isInstanceOf(ActivityNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw exception when activity date is outside trip dates")
        void shouldThrowExceptionWhenActivityDateIsOutsideTripDates() {
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

            // Try to schedule activity before trip starts
            assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2026, 3, 10), LocalTime.of(10, 0), 120, null))
                    .isInstanceOf(TripDateValidationException.class)
                    .hasMessageContaining("Activity date 2026-03-10 is outside trip dates");
        }

        @Test
        @DisplayName("Should throw exception when timezone-aware time conflict exists")
        void shouldThrowExceptionWhenTimezoneAwareTimeConflictExists() {
            // Set up an existing activity that would conflict
            TripActivity existingActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2026, 3, 15), LocalTime.of(9, 30), 90, "Europe/Paris");

            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(2L)).thenReturn(Optional.of(testActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Arrays.asList(existingActivity));

            assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 2L, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, null))
                    .isInstanceOf(TripActivityConflictException.class)
                    .hasMessageContaining("Time conflict with:");
        }
    }

    @Nested
    @DisplayName("Custom Activities")
    class CustomActivities {

        @Test
        @DisplayName("Should schedule custom activity successfully")
        void shouldScheduleCustomActivitySuccessfully() {
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Collections.emptyList());
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.scheduleCustomActivity(1L, "Custom Activity", "entertainment",
                    "Fun custom activity", 50.0, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), 90, "Europe/Paris");

            assertThat(result.getCustomName()).isEqualTo("Custom Activity");
            assertThat(result.getCustomCategory()).isEqualTo("entertainment");
            assertThat(result.getCustomDescription()).isEqualTo("Fun custom activity");
            assertThat(result.getCustomEstimatedCost()).isEqualTo(50.0);
            assertThat(result.getActivity()).isNull(); // Custom activities don't have linked Activity
            assertThat(result.getTimezone()).isEqualTo("Europe/Paris");
        }

        @Test
        @DisplayName("Should use default timezone when not provided for custom activity")
        void shouldUseDefaultTimezoneWhenNotProvidedForCustomActivity() {
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Collections.emptyList());
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.scheduleCustomActivity(1L, "Custom Activity", "entertainment",
                    null, 50.0, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), null, null);

            assertThat(result.getDurationMinutes()).isEqualTo(60); // Default duration
            assertThat(result.getTimezone()).isEqualTo("Europe/Paris"); // From trip's first destination
        }
    }

    @Nested
    @DisplayName("Update Activities")
    class UpdateActivities {

        @Test
        @DisplayName("Should update scheduled activity successfully")
        void shouldUpdateScheduledActivitySuccessfully() {
            when(tripActivityRepository.findById(1L)).thenReturn(Optional.of(testTripActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Collections.emptyList()); // No conflicts
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.updateScheduledActivity(1L, LocalDate.of(2026, 3, 16),
                    LocalTime.of(14, 0), 150, "Updated notes", "Custom Name", "Custom Description", 75.0);

            assertThat(result.getPlannedDate()).isEqualTo(LocalDate.of(2026, 3, 16));
            assertThat(result.getStartTime()).isEqualTo(LocalTime.of(14, 0));
            assertThat(result.getDurationMinutes()).isEqualTo(150);
            assertThat(result.getNotes()).isEqualTo("Updated notes");
            verify(tripActivityRepository).save(testTripActivity);
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent activity")
        void shouldThrowExceptionWhenUpdatingNonExistentActivity() {
            when(tripActivityRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> tripActivityService.updateScheduledActivity(999L, null, null, null, "notes", null, null, null))
                    .isInstanceOf(TripActivityNotFoundException.class);
        }

        @Test
        @DisplayName("Should update actual cost successfully")
        void shouldUpdateActualCostSuccessfully() {
            when(tripActivityRepository.findById(1L)).thenReturn(Optional.of(testTripActivity));
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.updateActualCost(1L, 3000);

            assertThat(result.getActualCost()).isEqualTo(3000);
            verify(tripActivityRepository).save(testTripActivity);
        }

        @Test
        @DisplayName("Should throw exception when updating actual cost for non-existent activity")
        void shouldThrowExceptionWhenUpdatingActualCostForNonExistentActivity() {
            when(tripActivityRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> tripActivityService.updateActualCost(999L, 3000))
                    .isInstanceOf(TripActivityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Retrieve Activities")
    class RetrieveActivities {

        @Test
        @DisplayName("Should get scheduled activities for trip")
        void shouldGetScheduledActivitiesForTrip() {
            List<TripActivity> expectedActivities = Arrays.asList(testTripActivity);
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L)).thenReturn(expectedActivities);

            List<TripActivity> result = tripActivityService.getScheduledActivities(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0)).isEqualTo(testTripActivity);
            verify(tripActivityRepository).findByTripIdOrderByPlannedDateAscStartTimeAsc(1L);
        }

        @Test
        @DisplayName("Should get activities for specific date")
        void shouldGetActivitiesForSpecificDate() {
            when(tripActivityRepository.findByTripIdAndPlannedDateOrderByStartTimeAsc(1L, LocalDate.of(2026, 3, 15)))
                    .thenReturn(Arrays.asList(testTripActivity));

            List<TripActivity> result = tripActivityService.getActivitiesForDate(1L, LocalDate.of(2026, 3, 15));

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getPlannedDate()).isEqualTo(LocalDate.of(2026, 3, 15));
        }

        @Test
        @DisplayName("Should get trip dates")
        void shouldGetTripDates() {
            List<LocalDate> expectedDates = Arrays.asList(LocalDate.of(2026, 3, 15), LocalDate.of(2026, 3, 16));
            when(tripActivityRepository.findDistinctPlannedDatesByTripId(1L)).thenReturn(expectedDates);

            List<LocalDate> result = tripActivityService.getTripDates(1L);

            assertThat(result).hasSize(2);
            assertThat(result).containsExactly(LocalDate.of(2026, 3, 15), LocalDate.of(2026, 3, 16));
        }
    }

    @Nested
    @DisplayName("Delete Activities")
    class DeleteActivities {

        @Test
        @DisplayName("Should remove activity from trip successfully")
        void shouldRemoveActivityFromTripSuccessfully() {
            when(tripActivityRepository.existsById(1L)).thenReturn(true);

            tripActivityService.removeActivityFromTrip(1L);

            verify(tripActivityRepository).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw exception when removing non-existent activity")
        void shouldThrowExceptionWhenRemovingNonExistentActivity() {
            when(tripActivityRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> tripActivityService.removeActivityFromTrip(999L))
                    .isInstanceOf(TripActivityNotFoundException.class);

            verify(tripActivityRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("Cost Calculations")
    class CostCalculations {

        @Test
        @DisplayName("Should calculate total estimated cost")
        void shouldCalculateTotalEstimatedCost() {
            when(tripActivityRepository.calculateTotalEstimatedCost(1L)).thenReturn(5000);

            Integer result = tripActivityService.calculateTotalEstimatedCost(1L);

            assertThat(result).isEqualTo(5000);
            verify(tripActivityRepository).calculateTotalEstimatedCost(1L);
        }

        @Test
        @DisplayName("Should calculate total actual cost")
        void shouldCalculateTotalActualCost() {
            when(tripActivityRepository.calculateTotalActualCost(1L)).thenReturn(4500);

            Integer result = tripActivityService.calculateTotalActualCost(1L);

            assertThat(result).isEqualTo(4500);
            verify(tripActivityRepository).calculateTotalActualCost(1L);
        }

        @Test
        @DisplayName("Should get scheduled activity count")
        void shouldGetScheduledActivityCount() {
            when(tripActivityRepository.countByTripId(1L)).thenReturn(3L);

            long result = tripActivityService.getScheduledActivityCount(1L);

            assertThat(result).isEqualTo(3L);
            verify(tripActivityRepository).countByTripId(1L);
        }
    }

    @Nested
    @DisplayName("Timezone Conflict Detection")
    class TimezoneConflictDetection {

        @Test
        @DisplayName("Should detect timezone-aware conflicts between Paris and London activities")
        void shouldDetectTimezoneAwareConflictsBetweenParisAndLondonActivities() {
            // Create London destination and activity
            Destination london = new Destination();
            london.setId(2L);
            london.setName("London");
            london.setTimezone("Europe/London");

            Activity londonActivity = new Activity("Big Ben", "tourist_attraction", london);
            londonActivity.setId(2L);
            londonActivity.setDurationMinutes(60);

            // Existing Paris activity: 10:00-12:00 Paris time = 09:00-11:00 London time
            TripActivity parisActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");

            // Try to schedule London activity: 10:30-11:30 London time (overlaps with Paris activity)
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(2L)).thenReturn(Optional.of(londonActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Arrays.asList(parisActivity));

            assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 2L, LocalDate.of(2026, 3, 15), LocalTime.of(10, 30), 60, null))
                    .isInstanceOf(TripActivityConflictException.class)
                    .hasMessageContaining("Time conflict with:");
        }

        @Test
        @DisplayName("Should allow non-conflicting activities in different timezones")
        void shouldAllowNonConflictingActivitiesInDifferentTimezones() {
            // Existing Paris activity: 10:00-12:00 Paris time = 09:00-11:00 London time
            TripActivity parisActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2026, 3, 15), LocalTime.of(10, 0), 120, "Europe/Paris");

            // Schedule London activity: 14:00-15:00 London time (no overlap)
            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(2L)).thenReturn(Optional.of(testActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Arrays.asList(parisActivity));
            when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            TripActivity result = tripActivityService.scheduleActivity(1L, 2L, LocalDate.of(2026, 3, 15), LocalTime.of(14, 0), 60, null);

            assertThat(result).isNotNull();
            verify(tripActivityRepository).save(any(TripActivity.class));
        }

        @Test
        @DisplayName("Should handle cross-midnight conflicts correctly")
        void shouldHandleCrossMidnightConflictsCorrectly() {
            // Existing late night activity: 23:00-01:00 (next day)
            TripActivity lateNightActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2026, 3, 15), LocalTime.of(23, 0), 120, "UTC");

            when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
            when(activityRepository.findById(2L)).thenReturn(Optional.of(testActivity));
            when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L))
                    .thenReturn(Arrays.asList(lateNightActivity));

            // Try to schedule early morning activity next day: 00:30-01:30 (conflicts with late night activity)
            assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 2L, LocalDate.of(2026, 3, 16), LocalTime.of(0, 30), 60, null))
                    .isInstanceOf(TripActivityConflictException.class)
                    .hasMessageContaining("Time conflict with:");
        }
    }
}