package com.travelplatform.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travelplatform.backend.config.GlobalExceptionHandler;
import com.travelplatform.backend.dto.TripCostSummary;
import com.travelplatform.backend.entity.TripActivity;
import com.travelplatform.backend.exception.TripActivityConflictException;
import com.travelplatform.backend.exception.TripActivityNotFoundException;
import com.travelplatform.backend.service.TripActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("TripActivity Controller Tests")
class TripActivityControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TripActivityService tripActivityService;

    @InjectMocks
    private TripActivityController tripActivityController;

    private TripActivity mockTripActivity;
    private List<TripActivity> mockActivitiesList;
    private TripCostSummary mockCostSummary;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // Fix date serialization

        mockMvc = MockMvcBuilders.standaloneSetup(tripActivityController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        setupTestData();
    }

    private void setupTestData() {
        mockTripActivity = new TripActivity();
        mockTripActivity.setId(1L);
        mockTripActivity.setPlannedDate(LocalDate.of(2026, 6, 15));
        mockTripActivity.setStartTime(LocalTime.of(10, 0));
        mockTripActivity.setDurationMinutes(120);
        mockTripActivity.setTimezone("UTC");

        mockActivitiesList = Arrays.asList(mockTripActivity);

        mockCostSummary = new TripCostSummary(5000, 4500, 3L);
    }

    @Nested
    @DisplayName("Schedule Activities")
    class ScheduleActivities {

        @Test
        @DisplayName("Should schedule activity successfully")
        void shouldScheduleActivitySuccessfully() throws Exception {
            when(tripActivityService.scheduleActivity(eq(1L), eq(2L), any(LocalDate.class),
                    any(LocalTime.class), eq(120), eq("Test notes")))
                    .thenReturn(mockTripActivity);

            mockMvc.perform(post("/api/trip-activities/schedule")
                            .param("tripId", "1")
                            .param("activityId", "2")
                            .param("plannedDate", "2026-06-15")
                            .param("startTime", "10:00")
                            .param("durationMinutes", "120")
                            .param("notes", "Test notes"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.plannedDate").value("2026-06-15"))
                    .andExpect(jsonPath("$.startTime").value("10:00:00"));

            verify(tripActivityService).scheduleActivity(1L, 2L, LocalDate.of(2026, 6, 15),
                    LocalTime.of(10, 0), 120, "Test notes");
        }

        @Test
        @DisplayName("Should handle time conflicts gracefully")
        void shouldHandleTimeConflictsGracefully() throws Exception {
            when(tripActivityService.scheduleActivity(any(), any(), any(), any(), any(), any()))
                    .thenThrow(new TripActivityConflictException("Time conflict with existing activity"));

            mockMvc.perform(post("/api/trip-activities/schedule")
                            .param("tripId", "1")
                            .param("activityId", "2")
                            .param("plannedDate", "2026-06-15")
                            .param("startTime", "10:00"))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("Should schedule custom activity successfully")
        void shouldScheduleCustomActivitySuccessfully() throws Exception {
            when(tripActivityService.scheduleCustomActivity(eq(1L), eq("Custom Activity"),
                    eq("entertainment"), eq("Fun activity"), eq(50.0),
                    any(LocalDate.class), any(LocalTime.class), eq(90), eq("UTC")))
                    .thenReturn(mockTripActivity);

            mockMvc.perform(post("/api/trip-activities/schedule-custom")
                            .param("tripId", "1")
                            .param("customName", "Custom Activity")
                            .param("customCategory", "entertainment")
                            .param("customDescription", "Fun activity")
                            .param("customEstimatedCost", "50.0")
                            .param("plannedDate", "2026-06-15")
                            .param("startTime", "10:00")
                            .param("durationMinutes", "90")
                            .param("timezone", "UTC"))
                    .andExpect(status().isCreated());

            verify(tripActivityService).scheduleCustomActivity(1L, "Custom Activity",
                    "entertainment", "Fun activity", 50.0,
                    LocalDate.of(2026, 6, 15), LocalTime.of(10, 0), 90, "UTC");
        }
    }

    @Nested
    @DisplayName("Retrieve Activities")
    class RetrieveActivities {

        @Test
        @DisplayName("Should get scheduled activities for trip")
        void shouldGetScheduledActivitiesForTrip() throws Exception {
            when(tripActivityService.getScheduledActivities(1L)).thenReturn(mockActivitiesList);

            mockMvc.perform(get("/api/trip-activities/trip/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].id").value(1));

            verify(tripActivityService).getScheduledActivities(1L);
        }

        @Test
        @DisplayName("Should get activities for specific date")
        void shouldGetActivitiesForSpecificDate() throws Exception {
            when(tripActivityService.getActivitiesForDate(1L, LocalDate.of(2026, 6, 15)))
                    .thenReturn(mockActivitiesList);

            mockMvc.perform(get("/api/trip-activities/trip/1/date/2026-06-15"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].plannedDate").value("2026-06-15"));

            verify(tripActivityService).getActivitiesForDate(1L, LocalDate.of(2026, 6, 15));
        }

        @Test
        @DisplayName("Should get trip dates")
        void shouldGetTripDates() throws Exception {
            List<LocalDate> dates = Arrays.asList(
                    LocalDate.of(2026, 6, 15),
                    LocalDate.of(2026, 6, 16)
            );
            when(tripActivityService.getTripDates(1L)).thenReturn(dates);

            mockMvc.perform(get("/api/trip-activities/trip/1/dates"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0]").value("2026-06-15"));

            verify(tripActivityService).getTripDates(1L);
        }
    }

    @Nested
    @DisplayName("Update Activities")
    class UpdateActivities {

        @Test
        @DisplayName("Should update scheduled activity successfully")
        void shouldUpdateScheduledActivitySuccessfully() throws Exception {
            when(tripActivityService.updateScheduledActivity(eq(1L), any(LocalDate.class),
                    any(LocalTime.class), eq(150), eq("Updated notes"),
                    isNull(), isNull(), isNull()))
                    .thenReturn(mockTripActivity);

            mockMvc.perform(put("/api/trip-activities/1")
                            .param("plannedDate", "2026-06-16")
                            .param("startTime", "11:00")
                            .param("durationMinutes", "150")
                            .param("notes", "Updated notes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1));

            verify(tripActivityService).updateScheduledActivity(1L, LocalDate.of(2026, 6, 16),
                    LocalTime.of(11, 0), 150, "Updated notes", null, null, null);
        }

        @Test
        @DisplayName("Should update actual cost successfully")
        void shouldUpdateActualCostSuccessfully() throws Exception {
            when(tripActivityService.updateActualCost(1L, 4500)).thenReturn(mockTripActivity);

            mockMvc.perform(put("/api/trip-activities/1/actual-cost")
                            .param("actualCost", "4500"))
                    .andExpect(status().isOk());

            verify(tripActivityService).updateActualCost(1L, 4500);
        }

        @Test
        @DisplayName("Should return 404 when updating non-existent activity")
        void shouldReturn404WhenUpdatingNonExistentActivity() throws Exception {
            when(tripActivityService.updateScheduledActivity(any(), any(), any(), any(), any(), any(), any(), any()))
                    .thenThrow(new TripActivityNotFoundException(999L));

            mockMvc.perform(put("/api/trip-activities/999")
                            .param("notes", "Updated notes"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Delete Activities")
    class DeleteActivities {

        @Test
        @DisplayName("Should remove activity from trip successfully")
        void shouldRemoveActivityFromTripSuccessfully() throws Exception {
            mockMvc.perform(delete("/api/trip-activities/1"))
                    .andExpect(status().isNoContent());

            verify(tripActivityService).removeActivityFromTrip(1L);
        }

        @Test
        @DisplayName("Should return 404 when deleting non-existent activity")
        void shouldReturn404WhenDeletingNonExistentActivity() throws Exception {
            doThrow(new TripActivityNotFoundException(999L))
                    .when(tripActivityService).removeActivityFromTrip(999L);

            mockMvc.perform(delete("/api/trip-activities/999"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("Timezone Conflict Detection")
    class TimezoneConflictDetection {

        @Test
        @DisplayName("Should detect conflicts across different timezones")
        void shouldDetectConflictsAcrossDifferentTimezones() throws Exception {
            // Simulate: 10 AM Paris activity conflicts with 2 PM London activity
            // (Paris 10-12 AM = London 9-11 AM, so 2-4 PM London should be fine, but test the conflict logic)
            when(tripActivityService.scheduleActivity(eq(1L), eq(2L),
                    eq(LocalDate.of(2026, 6, 15)), eq(LocalTime.of(14, 0)), eq(120), isNull()))
                    .thenThrow(new TripActivityConflictException(
                            "Time conflict with: Eiffel Tower (2026-06-15 10:00-12:00 Europe/Paris)"));

            mockMvc.perform(post("/api/trip-activities/schedule")
                            .param("tripId", "1")
                            .param("activityId", "2")
                            .param("plannedDate", "2026-06-15")
                            .param("startTime", "14:00")
                            .param("durationMinutes", "120"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("Time conflict")))
                    .andExpect(jsonPath("$.message").value(containsString("Europe/Paris")));
        }

        @Test
        @DisplayName("Should handle cross-midnight conflicts")
        void shouldHandleCrossMidnightConflicts() throws Exception {
            // Simulate: Late night activity conflicts with early morning next day
            when(tripActivityService.scheduleActivity(eq(1L), eq(3L),
                    eq(LocalDate.of(2026, 6, 16)), eq(LocalTime.of(1, 0)), eq(60), isNull()))
                    .thenThrow(new TripActivityConflictException(
                            "Time conflict with: Night Club (2026-06-15 23:00-01:00 UTC)"));

            mockMvc.perform(post("/api/trip-activities/schedule")
                            .param("tripId", "1")
                            .param("activityId", "3")
                            .param("plannedDate", "2026-06-16")
                            .param("startTime", "01:00")
                            .param("durationMinutes", "60"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("Night Club")));
        }

        @Test
        @DisplayName("Should allow non-conflicting activities in different timezones")
        void shouldAllowNonConflictingActivitiesInDifferentTimezones() throws Exception {
            when(tripActivityService.scheduleActivity(eq(1L), eq(2L),
                    eq(LocalDate.of(2026, 6, 15)), eq(LocalTime.of(16, 0)), eq(120), isNull()))
                    .thenReturn(mockTripActivity);

            mockMvc.perform(post("/api/trip-activities/schedule")
                            .param("tripId", "1")
                            .param("activityId", "2")
                            .param("plannedDate", "2026-06-15")
                            .param("startTime", "16:00")
                            .param("durationMinutes", "120"))
                    .andExpect(status().isCreated());

            verify(tripActivityService).scheduleActivity(1L, 2L, LocalDate.of(2026, 6, 15),
                    LocalTime.of(16, 0), 120, null);
        }

        @Test
        @DisplayName("Should handle timezone conflicts when updating activities")
        void shouldHandleTimezoneConflictsWhenUpdatingActivities() throws Exception {
            when(tripActivityService.updateScheduledActivity(eq(1L), eq(LocalDate.of(2026, 6, 15)),
                    eq(LocalTime.of(10, 30)), eq(180), isNull(), isNull(), isNull(), isNull()))
                    .thenThrow(new TripActivityConflictException(
                            "Time conflict with: Museum Tour (2026-06-15 09:00-12:00 Europe/London)"));

            mockMvc.perform(put("/api/trip-activities/1")
                            .param("plannedDate", "2026-06-15")
                            .param("startTime", "10:30")
                            .param("durationMinutes", "180"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value(containsString("Museum Tour")))
                    .andExpect(jsonPath("$.message").value(containsString("Europe/London")));
        }
    }

    @Nested
    @DisplayName("Cost Management")
    class CostManagement {

        @Test
        @DisplayName("Should get trip cost summary")
        void shouldGetTripCostSummary() throws Exception {
            when(tripActivityService.calculateTotalEstimatedCost(1L)).thenReturn(5000);
            when(tripActivityService.calculateTotalActualCost(1L)).thenReturn(4500);
            when(tripActivityService.getScheduledActivityCount(1L)).thenReturn(3L);

            mockMvc.perform(get("/api/trip-activities/trip/1/costs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.estimatedCost").value(5000))
                    .andExpect(jsonPath("$.actualCost").value(4500))
                    .andExpect(jsonPath("$.activityCount").value(3));

            verify(tripActivityService).calculateTotalEstimatedCost(1L);
            verify(tripActivityService).calculateTotalActualCost(1L);
            verify(tripActivityService).getScheduledActivityCount(1L);
        }
    }
}