package com.travelplatform.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.actuate.autoconfigure.metrics.SystemMetricsAutoConfiguration;

@SpringBootApplication(exclude = {
    SystemMetricsAutoConfiguration.class
})
@SpringBootApplication
public class TravelPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelPlatformApplication.class, args);
    }

}
