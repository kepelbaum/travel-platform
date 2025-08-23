package com.travelplatform.backend.dto;

import com.travelplatform.backend.entity.Activity;
import org.springframework.data.domain.Page;

import java.util.List;

public class ActivityPageResponse {
    private List<Activity> activities;
    private boolean hasMore;
    private long totalCount;
    private int currentPage;
    private int pageSize;
    private String source;
    private String query;
    private String category;

    public ActivityPageResponse() {}

    public static ActivityPageResponse fromPage(Page<Activity> page, String source) {
        ActivityPageResponse response = new ActivityPageResponse();
        response.activities = page.getContent();
        response.hasMore = page.hasNext();
        response.totalCount = page.getTotalElements();
        response.currentPage = page.getNumber() + 1; // Convert 0-based to 1-based
        response.pageSize = page.getSize();
        response.source = source;
        return response;
    }

    public List<Activity> getActivities() { return activities; }
    public void setActivities(List<Activity> activities) { this.activities = activities; }

    public boolean isHasMore() { return hasMore; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }

    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }

    public int getCurrentPage() { return currentPage; }
    public void setCurrentPage(int currentPage) { this.currentPage = currentPage; }

    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}