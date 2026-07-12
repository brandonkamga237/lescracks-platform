package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Public read-only endpoint for categories.
 * Used by the Ressources page filter UI (no authentication required).
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategories() {
        List<Map<String, Object>> response = categoryRepository.findAll().stream()
                .map(this::mapCategory)
                .toList();
        // Reference data, identical for every visitor and rarely changing: let the browser
        // cache it briefly so repeat navigations don't pay another round trip.
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(ApiResponse.success(response));
    }

    private Map<String, Object> mapCategory(Category c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        return m;
    }
}
