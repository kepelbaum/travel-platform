package com.travelplatform.backend.util;

import com.travelplatform.backend.entity.User;
import com.travelplatform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class UserSecurityUtil {

    @Autowired
    private UserRepository userRepository;

    public User getCurrentUser() {
        String userEmail = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public void validateTripOwnership(Long tripId, Long tripOwnerId) {
        Long currentUserId = getCurrentUserId();
        if (!currentUserId.equals(tripOwnerId)) {
            throw new RuntimeException("Access denied: You don't own this trip");
        }
    }
}