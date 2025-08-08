package com.travelplatform.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "trip_activities")
public class TripActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    @JsonIgnore
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonIgnore
    private Activity activity;

    @NotNull(message = "Planned date is required")
    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @NotNull(message = "Start time is required")
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "actual_cost")
    private Integer actualCost; // in cents, user can input actual cost spent

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public TripActivity() {}

    public TripActivity(Trip trip, Activity activity, LocalDate plannedDate, LocalTime startTime, Integer durationMinutes) {
        this.trip = trip;
        this.activity = activity;
        this.plannedDate = plannedDate;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public LocalTime getEndTime() {
        return startTime.plusMinutes(durationMinutes);
    }

    public boolean overlapsWith(LocalDate date, LocalTime start, Integer duration) {
        if (!this.plannedDate.equals(date)) {
            return false;
        }

        LocalTime thisEnd = this.getEndTime();
        LocalTime otherEnd = start.plusMinutes(duration);

        // Check if times overlap
        return this.startTime.isBefore(otherEnd) && start.isBefore(thisEnd);
    }

    public boolean overlapsWith(TripActivity other) {
        return overlapsWith(other.plannedDate, other.startTime, other.durationMinutes);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }

    public Activity getActivity() { return activity; }
    public void setActivity(Activity activity) { this.activity = activity; }

    public LocalDate getPlannedDate() { return plannedDate; }
    public void setPlannedDate(LocalDate plannedDate) { this.plannedDate = plannedDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getActualCost() { return actualCost; }
    public void setActualCost(Integer actualCost) { this.actualCost = actualCost; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}