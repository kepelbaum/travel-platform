package com.travelplatform.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/utils")
public class UtilsController {

//    @GetMapping("/categories")
//    public ResponseEntity<Set<String>> getSupportedCategories() {
//        Set<String> categories = ActivityDurationUtils.getSupportedCategories();
//        return ResponseEntity.ok(categories);
//    }
//
//    // Get default duration for a category
//    @GetMapping("/categories/{category}/duration")
//    public ResponseEntity<Map<String, Object>> getCategoryDefaults(@PathVariable String category) {
//        if (!ActivityDurationUtils.isValidCategory(category)) {
//            return ResponseEntity.badRequest().body(Map.of("error", "Invalid category"));
//        }
//
//        Integer duration = ActivityDurationUtils.getDefaultDuration(category);
//        Double cost = ActivityDurationUtils.getDefaultCostEstimate(category);
//
//        Map<String, Object> defaults = Map.of(
//                "category", category,
//                "durationMinutes", duration,
//                "durationFormatted", ActivityDurationUtils.formatDuration(duration),
//                "costEstimate", cost,
//                "costFormatted", ActivityDurationUtils.formatCost(cost)
//        );
//
//        return ResponseEntity.ok(defaults);
//    }
//
//    @GetMapping("/format/duration/{minutes}")
//    public ResponseEntity<Map<String, String>> formatDuration(@PathVariable Integer minutes) {
//        String formatted = ActivityDurationUtils.formatDuration(minutes);
//        return ResponseEntity.ok(Map.of("formatted", formatted, "minutes", minutes.toString()));
//    }
//
//    @GetMapping("/format/cost/{dollars}")
//    public ResponseEntity<Map<String, String>> formatCost(@PathVariable Double dollars) {
//        String formatted = ActivityDurationUtils.formatCost(dollars);
//        return ResponseEntity.ok(Map.of("formatted", formatted, "dollars", dollars.toString()));
//    }
//
//    @GetMapping("/categories/{category}/validate")
//    public ResponseEntity<Map<String, Boolean>> validateCategory(@PathVariable String category) {
//        boolean isValid = ActivityDurationUtils.isValidCategory(category);
//        return ResponseEntity.ok(Map.of("valid", isValid));
//    }
}