package com.brandonkamga.lescracks.taxonomy.api;

import com.brandonkamga.lescracks.taxonomy.api.dto.CategoryRequest;
import com.brandonkamga.lescracks.taxonomy.api.dto.CategoryResponse;
import com.brandonkamga.lescracks.taxonomy.api.dto.TagRequest;
import com.brandonkamga.lescracks.taxonomy.api.dto.TagResponse;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyMapper;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * How the catalogue is organised.
 *
 * Categories and tags share a controller because they are never used apart: a tag without its
 * category means nothing, and every screen that lists one lists the other.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Catégories et tags")
public class TaxonomyController {

    private final TaxonomyService taxonomy;
    private final TaxonomyMapper mapper;

    public TaxonomyController(TaxonomyService taxonomy, TaxonomyMapper mapper) {
        this.taxonomy = taxonomy;
        this.mapper = mapper;
    }

    @GetMapping("/categories")
    @Operation(summary = "Toutes les catégories")
    public List<CategoryResponse> categories() {
        return taxonomy.categories().stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/tags")
    @Operation(summary = "Les tags, par ordre alphabétique")
    public List<TagResponse> tags() {
        return taxonomy.tags().stream().map(mapper::toResponse).toList();
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return mapper.toResponse(taxonomy.createCategory(request.name()));
    }

    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse renameCategory(@PathVariable Long id,
                                           @Valid @RequestBody CategoryRequest request) {
        return mapper.toResponse(taxonomy.renameCategory(id, request.name()));
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
        return mapper.toResponse(taxonomy.createTag(request.name()));
    }

    @PutMapping("/admin/tags/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TagResponse renameTag(@PathVariable Long id, @Valid @RequestBody TagRequest request) {
        return mapper.toResponse(taxonomy.renameTag(id, request.name()));
    }

    @DeleteMapping("/admin/tags/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(@PathVariable Long id) {
        taxonomy.deleteTag(id);
    }
}
