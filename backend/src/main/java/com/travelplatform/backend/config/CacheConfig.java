package com.travelplatform.backend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();

        cacheManager.setCacheNames(java.util.Arrays.asList(
                "destinationActivities",     // Main cache for activities by destination
                "categoryActivities",        // Cache for activities by destination + category
                "activityById",             // Cache for individual activities
                "activityCategories",       // Cache for available categories
                "topRatedActivities"        // Cache for top-rated activities
        ));

        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}