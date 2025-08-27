package com.travelplatform.backend.repository;

import com.travelplatform.backend.entity.*;
import com.travelplatform.backend.service.TripActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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

    @BeforeEach
    void setUp() {
        User testUser = new User("John", "john@test.com", "password");
        testUser.setId(1L);

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setName("Paris Trip");
        testTrip.setUser(testUser);
        testTrip.setStartDate(LocalDate.of(2024, 3, 15));
        testTrip.setEndDate(LocalDate.of(2024, 3, 20));

        Destination testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");

        testActivity = new Activity("Eiffel Tower", "tourist_attraction", testDestination);
        testActivity.setId(1L);
        testActivity.setDurationMinutes(120);

        testTripActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120);
        testTripActivity.setId(1L);
    }

    @Test
    void scheduleActivity_SuccessfullySchedulesWithoutConflicts() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(tripActivityRepository.existsByTripIdAndActivityId(1L, 1L)).thenReturn(false);
        when(tripActivityRepository.hasTimeConflict(1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120)).thenReturn(false);
        when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TripActivity result = tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120);

        assertThat(result.getTrip()).isEqualTo(testTrip);
        assertThat(result.getActivity()).isEqualTo(testActivity);
        assertThat(result.getPlannedDate()).isEqualTo(LocalDate.of(2024, 3, 15));
        assertThat(result.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(result.getDurationMinutes()).isEqualTo(120);
        verify(tripActivityRepository).save(any(TripActivity.class));
    }

    @Test
    void scheduleActivity_UsesActivityDefaultDurationWhenNotProvided() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(tripActivityRepository.existsByTripIdAndActivityId(1L, 1L)).thenReturn(false);
        when(tripActivityRepository.hasTimeConflict(1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120)).thenReturn(false);
        when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TripActivity result = tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), null);

        assertThat(result.getDurationMinutes()).isEqualTo(120);
    }

    @Test
    void scheduleActivity_ThrowsExceptionWhenTripNotFound() {
        when(tripRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tripActivityService.scheduleActivity(999L, 1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Trip not found with id: 999");

        verify(tripActivityRepository, never()).save(any());
    }

    @Test
    void scheduleActivity_ThrowsExceptionWhenActivityNotFound() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(activityRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 999L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Activity not found with id: 999");
    }

    @Test
    void scheduleActivity_ThrowsExceptionWhenActivityAlreadyScheduled() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(tripActivityRepository.existsByTripIdAndActivityId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Activity is already scheduled for this trip");
    }

    @Test
    void scheduleActivity_ThrowsExceptionWhenTimeConflictExists() {
        when(tripRepository.findById(1L)).thenReturn(Optional.of(testTrip));
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(tripActivityRepository.existsByTripIdAndActivityId(1L, 1L)).thenReturn(false);
        when(tripActivityRepository.hasTimeConflict(1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120)).thenReturn(true);

        TripActivity conflictingActivity = new TripActivity(testTrip, testActivity, LocalDate.of(2024, 3, 15), LocalTime.of(9, 30), 90);
        when(tripActivityRepository.findConflictingActivities(1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120))
                .thenReturn(Arrays.asList(conflictingActivity));

        assertThatThrownBy(() -> tripActivityService.scheduleActivity(1L, 1L, LocalDate.of(2024, 3, 15), LocalTime.of(10, 0), 120))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Time conflict with:");
    }

    @Test
    void getScheduledActivities_ReturnsActivitiesForTrip() {
        List<TripActivity> expectedActivities = Arrays.asList(testTripActivity);
        when(tripActivityRepository.findByTripIdOrderByPlannedDateAscStartTimeAsc(1L)).thenReturn(expectedActivities);

        List<TripActivity> result = tripActivityService.getScheduledActivities(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(testTripActivity);
        verify(tripActivityRepository).findByTripIdOrderByPlannedDateAscStartTimeAsc(1L);
    }
//DO NOT DELETE - TO BE ADJUSTED
//    @Test
//    void updateScheduledActivity_UpdatesSuccessfully() {
//        when(tripActivityRepository.findById(1L)).thenReturn(Optional.of(testTripActivity));
//        when(tripActivityRepository.findConflictingActivities(any(), any(), any(), any())).thenReturn(Collections.emptyList());
//        when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));
//
//        TripActivity result = tripActivityService.updateScheduledActivity(1L, LocalDate.of(2024, 3, 16), LocalTime.of(14, 0), 150, "Updated notes");
//
//        assertThat(result.getPlannedDate()).isEqualTo(LocalDate.of(2024, 3, 16));
//        assertThat(result.getStartTime()).isEqualTo(LocalTime.of(14, 0));
//        assertThat(result.getDurationMinutes()).isEqualTo(150);
//        assertThat(result.getNotes()).isEqualTo("Updated notes");
//        verify(tripActivityRepository).save(testTripActivity);
//    }
//
//    @Test
//    void updateScheduledActivity_ThrowsExceptionWhenNotFound() {
//        when(tripActivityRepository.findById(999L)).thenReturn(Optional.empty());
//
//        assertThatThrownBy(() -> tripActivityService.updateScheduledActivity(999L, null, null, null, "notes"))
//                .isInstanceOf(RuntimeException.class)
//                .hasMessageContaining("Scheduled activity not found with id: 999");
//    }

    @Test
    void removeActivityFromTrip_RemovesSuccessfully() {
        when(tripActivityRepository.existsById(1L)).thenReturn(true);

        tripActivityService.removeActivityFromTrip(1L);

        verify(tripActivityRepository).deleteById(1L);
    }

    @Test
    void removeActivityFromTrip_ThrowsExceptionWhenNotFound() {
        when(tripActivityRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> tripActivityService.removeActivityFromTrip(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Scheduled activity not found with id: 999");

        verify(tripActivityRepository, never()).deleteById(any());
    }

    @Test
    void calculateTotalEstimatedCost_ReturnsCorrectTotal() {
        when(tripActivityRepository.calculateTotalEstimatedCost(1L)).thenReturn(5000);

        Integer result = tripActivityService.calculateTotalEstimatedCost(1L);

        assertThat(result).isEqualTo(5000);
        verify(tripActivityRepository).calculateTotalEstimatedCost(1L);
    }

    @Test
    void updateActualCost_UpdatesSuccessfully() {
        when(tripActivityRepository.findById(1L)).thenReturn(Optional.of(testTripActivity));
        when(tripActivityRepository.save(any(TripActivity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TripActivity result = tripActivityService.updateActualCost(1L, 3000);

        assertThat(result.getActualCost()).isEqualTo(3000);
        verify(tripActivityRepository).save(testTripActivity);
    }
}