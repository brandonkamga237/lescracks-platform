package com.brandonkamga.lescracks.taxonomy.api;

import com.brandonkamga.lescracks.taxonomy.api.dto.CategoryRequest;
import com.brandonkamga.lescracks.taxonomy.api.dto.CategoryResponse;
import com.brandonkamga.lescracks.taxonomy.api.dto.TagRequest;
import com.brandonkamga.lescracks.taxonomy.api.dto.TagResponse;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

/** How the blog is organised: themes and tags share a controller because every screen lists both. */
@RestController
@RequestMapping("/api")
@Tag(name = "Catégories et tags")
public class TaxonomyController {

    private final TaxonomyService taxonomy;

    public TaxonomyController(TaxonomyService taxonomy) {
        this.taxonomy = taxonomy;
    }

    @GetMapping("/categories")
    @Operation(summary = "Toutes les catégories")
    public List<CategoryResponse> categories() {
        return taxonomy.listCategories().stream().map(CategoryResponse::of).toList();
    }

    @GetMapping("/tags")
    @Operation(summary = "Les tags, par ordre alphabétique")
    public List<TagResponse> tags() {
        return taxonomy.listTags().stream().map(TagResponse::of).toList();
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return CategoryResponse.of(taxonomy.createCategory(request.name()));
    }

    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse renameCategory(@PathVariable Long id,
                                           @Valid @RequestBody CategoryRequest request) {
        return CategoryResponse.of(taxonomy.renameCategory(id, request.name()));
    }

    @DeleteMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        taxonomy.deleteCategory(id);
    }

    @PostMapping("/admin/tags")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(@Valid @RequestBody TagRequest request) {
        return TagResponse.of(taxonomy.createTag(request.name()));
    }

    @PutMapping("/admin/tags/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TagResponse renameTag(@PathVariable Long id, @Valid @RequestBody TagRequest request) {
        return TagResponse.of(taxonomy.renameTag(id, request.name()));
    }

    @DeleteMapping("/admin/tags/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(@PathVariable Long id) {
        taxonomy.deleteTag(id);
    }
}
