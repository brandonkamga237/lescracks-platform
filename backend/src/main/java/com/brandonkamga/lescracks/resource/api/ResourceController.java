package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.resource.api.dto.ArticleResourceRequest;
import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.api.dto.ThemeResponse;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.shared.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Ressources")
public class ResourceController {
    private final ResourceService resources;
    private final ResourceMapper mapper;

    public ResourceController(ResourceService resources, ResourceMapper mapper) {
        this.resources = resources;
        this.mapper = mapper;
    }

    @GetMapping
    @Operation(summary = "Consulter les ressources publiées")
    public PageResponse<ResourceResponse> published(@RequestParam(required = false) String search,
                                                    @RequestParam(required = false) Long categoryId,
                                                    @RequestParam(required = false) Long tagId,
                                                    @PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(resources.search(ResourceStatus.PUBLISHED, search, categoryId, tagId, pageable), mapper::toResponse);
    }

    @GetMapping("/themes")
    @Operation(summary = "Les thèmes qui contiennent des articles publiés, avec leur nombre")
    public List<ThemeResponse> themes() {
        return resources.publishedThemes().stream().map(ThemeResponse::of).toList();
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Consulter une ressource publiée")
    public ResourceResponse get(@PathVariable String slug) {
        return mapper.toResponse(resources.requirePublishedBySlugOrId(slug));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ResourceResponse> all(@RequestParam(required = false) ResourceStatus status,
                                              @RequestParam(required = false) String search,
                                              @RequestParam(required = false) Long categoryId,
                                              @RequestParam(required = false) Long tagId,
                                              @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(resources.search(status, search, categoryId, tagId, pageable), mapper::toResponse);
    }

    @PostMapping(value = "/admin/articles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createArticle(@Valid @RequestPart("data") ArticleResourceRequest request,
                                          @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.createArticle(request.toContent(), coverImageFile));
    }

    @PutMapping(value = "/admin/articles/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateArticle(@PathVariable Long id,
                                          @Valid @RequestPart("data") ArticleResourceRequest request,
                                          @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.updateArticle(id, request.toContent(), coverImageFile));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        resources.delete(id);
    }
}
