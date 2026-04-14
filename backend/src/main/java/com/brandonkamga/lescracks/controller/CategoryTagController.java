package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Public read-only endpoints for categories and tags.
 * Used by the Ressources page filter UI (no authentication required).
 */
@RestController
@RequestMapping("/api")
public class CategoryTagController {

    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    public CategoryTagController(CategoryRepository categoryRepository, TagRepository tagRepository) {
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategories() {
        List<Map<String, Object>> response = categoryRepository.findAll().stream()
                .map(this::mapCategory)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTags() {
        List<Map<String, Object>> response = tagRepository.findAll().stream()
                .map(this::mapTag)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Map<String, Object> mapCategory(Category c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getName());
        return m;
    }

    private Map<String, Object> mapTag(Tag t) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        if (t.getCategory() != null) {
            m.put("categoryId", t.getCategory().getId());
            m.put("categoryName", t.getCategory().getName());
        } else {
            m.put("categoryId", null);
            m.put("categoryName", null);
        }
        return m;
    }
}
