package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.service.interfaces.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tags")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Tags", description = "API de gestion des tags")
@SecurityRequirement(name = "bearerAuth")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(summary = "Liste tous les tags", description = "Retourne la liste de tous les tags disponibles.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Liste des tags")
    })
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags() {
        List<TagResponse> tags = tagService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un tag par ID")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tag trouvé"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tag non trouvé")
    })
    public ResponseEntity<ApiResponse<TagResponse>> getTagById(
            @Parameter(description = "ID du tag", required = true) @PathVariable Long id) {
        return tagService.findByIdOptional(id)
                .map(tag -> ResponseEntity.ok(ApiResponse.success(toResponse(tag))))
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Récupérer un tag par nom")
    public ResponseEntity<ApiResponse<TagResponse>> getTagByName(
            @Parameter(description = "Nom du tag", required = true) @PathVariable String name) {
        return tagService.findByName(name)
                .map(tag -> ResponseEntity.ok(ApiResponse.success(toResponse(tag))))
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "name", name));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Récupérer les tags par catégorie")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getTagsByCategory(
            @Parameter(description = "ID de la catégorie", required = true) @PathVariable Long categoryId) {
        List<TagResponse> tags = tagService.findByCategoryId(categoryId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un tag")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tag supprimé"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Accès interdit")
    })
    public ResponseEntity<ApiResponse<Void>> deleteTag(
            @Parameter(description = "ID du tag", required = true) @PathVariable Long id) {
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
