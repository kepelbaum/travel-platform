package com.travelplatform.backend.controller;

import com.travelplatform.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@Profile("test")
public class TestController {

    @Autowired
    private AuthService authService;

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteTestUser(@PathVariable Long userId) {
        authService.deleteUserAccount(userId);
        return ResponseEntity.noContent().build();
    }
}