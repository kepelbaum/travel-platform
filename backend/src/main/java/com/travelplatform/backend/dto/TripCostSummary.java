package com.travelplatform.backend.dto;

public class TripCostSummary {
    private Integer estimatedCost;
    private Integer actualCost;
    private Long activityCount;

    public TripCostSummary() {}

    public TripCostSummary(Integer estimatedCost, Integer actualCost, Long activityCount) {
        this.estimatedCost = estimatedCost;
        this.actualCost = actualCost;
        this.activityCount = activityCount;
    }

    public Integer getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Integer estimatedCost) { this.estimatedCost = estimatedCost; }

    public Integer getActualCost() { return actualCost; }
    public void setActualCost(Integer actualCost) { this.actualCost = actualCost; }

    public Long getActivityCount() { return activityCount; }
    public void setActivityCount(Long activityCount) { this.activityCount = activityCount; }
}