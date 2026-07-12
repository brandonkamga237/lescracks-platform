package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.service.interfaces.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tags")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Tags", description = "Tag management API")
@SecurityRequirement(name = "bearerAuth")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(summary = "List all tags", description = "Returns the list of all available tags.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tag list")
    })
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags() {
        List<TagResponse> tags = tagService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        // Reference data, identical for every visitor and rarely changing: let the browser
        // cache it briefly so repeat navigations don't pay another round trip.
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(ApiResponse.success(tags));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tag by ID")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tag found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tag not found")
    })
    public ResponseEntity<ApiResponse<TagResponse>> getTagById(
            @Parameter(description = "Tag ID", required = true) @PathVariable Long id) {
        return tagService.findByIdOptional(id)
                .map(tag -> ResponseEntity.ok(ApiResponse.success(toResponse(tag))))
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Get tag by name")
    public ResponseEntity<ApiResponse<TagResponse>> getTagByName(
            @Parameter(description = "Tag name", required = true) @PathVariable String name) {
        return tagService.findByName(name)
                .map(tag -> ResponseEntity.ok(ApiResponse.success(toResponse(tag))))
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "name", name));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get tags by category")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getTagsByCategory(
            @Parameter(description = "Category ID", required = true) @PathVariable Long categoryId) {
        List<TagResponse> tags = tagService.findByCategoryId(categoryId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a tag")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tag deleted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<ApiResponse<Void>> deleteTag(
            @Parameter(description = "Tag ID", required = true) @PathVariable Long id) {
        if (!tagService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Tag", "id", id);
        }
        tagService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tag deleted successfully"));
    }

    private TagResponse toResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .categoryId(tag.getCategory() != null ? tag.getCategory().getId() : null)
                .categoryName(tag.getCategory() != null ? tag.getCategory().getName() : null)
                .build();
    }

    public static class TagResponse {
        private Long id;
        private String name;
        private Long categoryId;
        private String categoryName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private TagResponse tagResponse = new TagResponse();

            public Builder id(Long id) { tagResponse.id = id; return this; }
            public Builder name(String name) { tagResponse.name = name; return this; }
            public Builder categoryId(Long categoryId) { tagResponse.categoryId = categoryId; return this; }
            public Builder categoryName(String categoryName) { tagResponse.categoryName = categoryName; return this; }
            public TagResponse build() { return tagResponse; }
        }
    }
}
