package com.travelplatform.backend.repository;

import com.travelplatform.backend.controller.ActivityController;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ActivityControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ActivityService activityService;

    @InjectMocks
    private ActivityController activityController;

    private Activity testActivity;
    private Destination testDestination;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(activityController).build();

        testDestination = new Destination();
        testDestination.setId(1L);
        testDestination.setName("Paris");

        testActivity = new Activity("Eiffel Tower", "tourist_attraction", testDestination);
        testActivity.setId(1L);
        testActivity.setDurationMinutes(120);
        testActivity.setEstimatedCost(2000.0);
    }

    @Test
    void getActivitiesByDestination_ReturnsOkWithActivities() throws Exception {
        List<Activity> activities = Arrays.asList(testActivity);
        when(activityService.getActivitiesByDestination(1L)).thenReturn(activities);

        mockMvc.perform(get("/api/activities/destination/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Eiffel Tower"))
                .andExpect(jsonPath("$[0].category").value("tourist_attraction"));
    }

    @Test
    void getActivitiesByDestination_ReturnsInternalServerErrorOnException() throws Exception {
        when(activityService.getActivitiesByDestination(1L)).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/activities/destination/1"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getActivityById_ReturnsOkWhenFound() throws Exception {
        when(activityService.getActivityById(1L)).thenReturn(Optional.of(testActivity));

        mockMvc.perform(get("/api/activities/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("Eiffel Tower"))
                .andExpect(jsonPath("$.durationMinutes").value(120));
    }

    @Test
    void getActivityById_ReturnsNotFoundWhenNotExists() throws Exception {
        when(activityService.getActivityById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/activities/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchActivities_ReturnsMatchingActivities() throws Exception {
        List<Activity> activities = Arrays.asList(testActivity);
        when(activityService.searchActivities(1L, "tower")).thenReturn(activities);

        mockMvc.perform(get("/api/activities/destination/1/search")
                        .param("query", "tower"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Eiffel Tower"));
    }

    @Test
    void createCustomActivity_ReturnsCreatedWithActivity() throws Exception {
        Activity museumActivity = new Activity("Museum", "museum", testDestination);
        museumActivity.setId(2L);
        museumActivity.setDurationMinutes(180);
        museumActivity.setEstimatedCost(1500.0);

        when(activityService.createCustomActivity(eq(1L), eq("Museum"), eq("museum"), eq(180), eq(1500.0), eq("Great museum")))
                .thenReturn(museumActivity);

        mockMvc.perform(post("/api/activities/destination/1/custom")
                        .param("name", "Museum")
                        .param("category", "museum")
                        .param("durationMinutes", "180")
                        .param("estimatedCost", "1500.0")
                        .param("description", "Great museum"))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("Museum"));
    }

    @Test
    void createCustomActivity_ReturnsBadRequestOnServiceException() throws Exception {
        when(activityService.createCustomActivity(any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Destination not found"));

        mockMvc.perform(post("/api/activities/destination/999/custom")
                        .param("name", "Museum")
                        .param("category", "museum"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateActivity_ReturnsOkWithUpdatedActivity() throws Exception {
        when(activityService.updateActivity(eq(1L), eq("Updated Tower"), any(), any(), any(), any()))
                .thenReturn(testActivity);

        mockMvc.perform(put("/api/activities/1")
                        .param("name", "Updated Tower"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.name").value("Eiffel Tower"));
    }

    @Test
    void updateActivity_ReturnsNotFoundWhenActivityNotExists() throws Exception {
        when(activityService.updateActivity(any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Activity not found"));

        mockMvc.perform(put("/api/activities/999")
                        .param("name", "Updated Name"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteActivity_ReturnsNoContentOnSuccess() throws Exception {
        mockMvc.perform(delete("/api/activities/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteActivity_ReturnsNotFoundWhenActivityNotExists() throws Exception {
        doThrow(new ActivityNotFoundException(999L))
                .when(activityService).deleteActivity(999L);

        mockMvc.perform(delete("/api/activities/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getActivityCount_ReturnsCount() throws Exception {
        when(activityService.getActivityCount(1L)).thenReturn(5L);

        mockMvc.perform(get("/api/activities/destination/1/count"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").value(5));
    }
}