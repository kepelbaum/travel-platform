package com.travelplatform.backend.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.travelplatform.backend.config.GlobalExceptionHandler;
import com.travelplatform.backend.controller.TripActivityController;
import com.travelplatform.backend.entity.Activity;
import com.travelplatform.backend.entity.Destination;
import com.travelplatform.backend.entity.Trip;
import com.travelplatform.backend.entity.TripActivity;
import com.travelplatform.backend.exception.TripActivityNotFoundException;
import com.travelplatform.backend.service.TripActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TripActivityControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TripActivityService tripActivityService;

    @InjectMocks
    private TripActivityController tripActivityController;

    private TripActivity testTripActivity;
    private Activity testActivity;
    private Trip testTrip;
    private Destination testDestination;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        mockMvc = MockMvcBuilders.standaloneSetup(tripActivityController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();

        testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");

        testActivity = new Activity("Eiffel Tower", "tourist_attraction", testDestination);
        testActivity.setId(1L);
        testActivity.setDurationMinutes(120);
        testActivity.setCostEstimate(2000);

        testTrip = new Trip();
        testTrip.setId(1L);
        testTrip.setDestinations(Arrays.asList(testDestination));

        testTripActivity = new TripActivity();
        testTripActivity.setId(1L);
        testTripActivity.setTrip(testTrip);
        testTripActivity.setActivity(testActivity);
        testTripActivity.setPlannedDate(LocalDate.of(2025, 8, 15));
        testTripActivity.setStartTime(LocalTime.of(10, 0));
        testTripActivity.setDurationMinutes(120);
        testTripActivity.setActualCost(2000);
    }

    @Test
    void scheduleActivity_ReturnsCreatedWithTripActivity() throws Exception {
        when(tripActivityService.scheduleActivity(eq(1L), eq(1L), any(LocalDate.class),
                any(LocalTime.class), eq(120))).thenReturn(testTripActivity);

        mockMvc.perform(post("/api/trip-activities/schedule")
                        .param("tripId", "1")
                        .param("activityId", "1")
                        .param("plannedDate", "2025-08-15")
                        .param("startTime", "10:00")
                        .param("durationMinutes", "120"))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.plannedDate").value("2025-08-15"))
                .andExpect(jsonPath("$.startTime").value("10:00:00"));
    }

    @Test
    void scheduleActivity_ReturnsBadRequestOnServiceException() throws Exception {
        when(tripActivityService.scheduleActivity(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Trip not found"));

        mockMvc.perform(post("/api/trip-activities/schedule")
                        .param("tripId", "999")
                        .param("activityId", "1")
                        .param("plannedDate", "2025-08-15")
                        .param("startTime", "10:00"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Trip not found"));
    }

    @Test
    void getScheduledActivities_ReturnsOkWithActivities() throws Exception {
        List<TripActivity> activities = Arrays.asList(testTripActivity);
        when(tripActivityService.getScheduledActivities(1L)).thenReturn(activities);

        mockMvc.perform(get("/api/trip-activities/trip/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].plannedDate").value("2025-08-15"));
    }

    @Test
    void getScheduledActivities_ReturnsInternalServerErrorOnException() throws Exception {
        when(tripActivityService.getScheduledActivities(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/trip-activities/trip/1"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getActivitiesForDate_ReturnsOkWithFilteredActivities() throws Exception {
        List<TripActivity> activities = Arrays.asList(testTripActivity);
        when(tripActivityService.getActivitiesForDate(1L, LocalDate.of(2025, 8, 15)))
                .thenReturn(activities);

        mockMvc.perform(get("/api/trip-activities/trip/1/date/2025-08-15"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].plannedDate").value("2025-08-15"));
    }

    @Test
    void getActivitiesInDateRange_ReturnsOkWithActivitiesInRange() throws Exception {
        List<TripActivity> activities = Arrays.asList(testTripActivity);
        when(tripActivityService.getActivitiesInDateRange(1L, LocalDate.of(2025, 8, 10),
                LocalDate.of(2025, 8, 20))).thenReturn(activities);

        mockMvc.perform(get("/api/trip-activities/trip/1/date-range")
                        .param("startDate", "2025-08-10")
                        .param("endDate", "2025-08-20"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].plannedDate").value("2025-08-15"));
    }

    @Test
    void updateScheduledActivity_ReturnsOkWithUpdatedActivity() throws Exception {
        when(tripActivityService.updateScheduledActivity(eq(1L), any(LocalDate.class),
                any(LocalTime.class), eq(180), eq("Updated notes")))
                .thenReturn(testTripActivity);

        mockMvc.perform(put("/api/trip-activities/1")
                        .param("plannedDate", "2025-08-16")
                        .param("startTime", "14:00")
                        .param("durationMinutes", "180")
                        .param("notes", "Updated notes"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateScheduledActivity_ReturnsNotFoundWhenTripActivityNotExists() throws Exception {
        when(tripActivityService.updateScheduledActivity(any(), any(), any(), any(), any()))
                .thenThrow(new TripActivityNotFoundException(999L));

        mockMvc.perform(put("/api/trip-activities/999")
                        .param("plannedDate", "2025-08-16"))
                .andExpect(status().isNotFound());
    }

    @Test
    void removeActivityFromTrip_ReturnsNoContentOnSuccess() throws Exception {
        mockMvc.perform(delete("/api/trip-activities/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void removeActivityFromTrip_ReturnsNotFoundWhenTripActivityNotExists() throws Exception {
        doThrow(new TripActivityNotFoundException(999L))
                .when(tripActivityService).removeActivityFromTrip(999L);

        mockMvc.perform(delete("/api/trip-activities/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateActualCost_ReturnsOkWithUpdatedActivity() throws Exception {
        when(tripActivityService.updateActualCost(1L, 2500)).thenReturn(testTripActivity);

        mockMvc.perform(put("/api/trip-activities/1/actual-cost")
                        .param("actualCost", "2500"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateActualCost_ReturnsNotFoundWhenTripActivityNotExists() throws Exception {
        when(tripActivityService.updateActualCost(999L, 2500))
                .thenThrow(new TripActivityNotFoundException(999L));

        mockMvc.perform(put("/api/trip-activities/999/actual-cost")
                        .param("actualCost", "2500"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getTripCosts_ReturnsOkWithCostSummary() throws Exception {
        when(tripActivityService.calculateTotalEstimatedCost(1L)).thenReturn(5000);
        when(tripActivityService.calculateTotalActualCost(1L)).thenReturn(4500);
        when(tripActivityService.getScheduledActivityCount(1L)).thenReturn(3L);

        mockMvc.perform(get("/api/trip-activities/trip/1/costs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.estimatedCost").value(5000))
                .andExpect(jsonPath("$.actualCost").value(4500))
                .andExpect(jsonPath("$.activityCount").value(3));
    }

    @Test
    void getTripCosts_ReturnsInternalServerErrorOnException() throws Exception {
        when(tripActivityService.calculateTotalEstimatedCost(1L))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/trip-activities/trip/1/costs"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getTripDates_ReturnsOkWithDates() throws Exception {
        List<LocalDate> dates = Arrays.asList(
                LocalDate.of(2025, 8, 15),
                LocalDate.of(2025, 8, 16)
        );
        when(tripActivityService.getTripDates(1L)).thenReturn(dates);

        mockMvc.perform(get("/api/trip-activities/trip/1/dates"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0]").value("2025-08-15"))
                .andExpect(jsonPath("$[1]").value("2025-08-16"));
    }

    @Test
    void getTripDates_ReturnsInternalServerErrorOnException() throws Exception {
        when(tripActivityService.getTripDates(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/trip-activities/trip/1/dates"))
                .andExpect(status().isInternalServerError());
    }
}
