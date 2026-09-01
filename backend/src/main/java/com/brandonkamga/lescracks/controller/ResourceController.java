package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ResourceEbook;
import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.dto.resource.*;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.mapper.ResourceMapper;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Ressources")
public class ResourceController {

    private final ResourceService resources;
    private final StorageService storage;
    private final ResourceMapper mapper;

    public ResourceController(ResourceService resources, StorageService storage, ResourceMapper mapper) {
        this.resources = resources;
        this.storage = storage;
        this.mapper = mapper;
    }

    @GetMapping
    @Operation(summary = "Le catalogue, filtrable par type, catégorie, tags et recherche")
    public PageResponse<ResourceSummary> search(
            @RequestParam(required = false) ResourceKind kind,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Set<Long> tagIds,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(
                resources.search(kind, categoryId, tagIds, search, pageable), mapper::toSummary);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Une ressource")
    public ResourceDetail bySlug(@PathVariable String slug) {
        return mapper.toDetail(resources.requireBySlug(slug));
    }

    /**
     * Counting a view. Open, and answered with no content: a reader's page should not wait on
     * a statistic, and a lost view costs less than a slow page.
     */
    @PostMapping("/{id}/view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Enregistrer une consultation")
    public void recordView(@PathVariable Long id) {
        resources.recordView(id);
    }

    /**
     * Serving an ebook through the API rather than from storage directly: the file keeps its
     * original name on the way out, and the platform stays able to decide who may take it.
     */
    @GetMapping("/download/{id}")
    @Operation(summary = "Télécharger un ebook")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) {
        if (!(resources.require(id) instanceof ResourceEbook ebook)) {
            throw new NotFoundException("Cette ressource n'est pas un ebook.");
        }
        var stored = storage.read(ebook.getFileKey())
                .orElseThrow(() -> new NotFoundException("Fichier", "id", id));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + ebook.getOriginalName() + "\"")
                .contentType(MediaType.parseMediaType(ebook.getContentType()))
                .contentLength(stored.size())
                .body(new InputStreamResource(stored.content()));
    }

    // ── Back office ───────────────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toutes les ressources, publiées ou non")
    public PageResponse<ResourceSummary> all(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(resources.all(pageable), mapper::toSummary);
    }

    @PostMapping("/admin/videos")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceDetail createVideo(@Valid @RequestBody VideoRequest request) {
        return mapper.toDetail(resources.createVideo(toDraft(request)));
    }

    @PutMapping("/admin/videos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceDetail updateVideo(@PathVariable Long id, @Valid @RequestBody VideoRequest request) {
        return mapper.toDetail(resources.updateVideo(id, toDraft(request)));
    }

    /** Multipart: the file travels beside the description rather than encoded inside it. */
    @PostMapping(value = "/admin/ebooks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceDetail createEbook(@Valid @RequestPart("data") EbookRequest request,
                                      @RequestPart("file") MultipartFile file) {
        return mapper.toDetail(resources.createEbook(
                new ResourceService.EbookDraft(toCommon(request.common()), request.pageCount()), file));
    }

    @PostMapping("/admin/articles")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceDetail createArticle(@Valid @RequestBody ArticleRequest request) {
        return mapper.toDetail(resources.createArticle(toDraft(request)));
    }

    @PutMapping("/admin/articles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceDetail updateArticle(@PathVariable Long id,
                                        @Valid @RequestBody ArticleRequest request) {
        return mapper.toDetail(resources.updateArticle(id, toDraft(request)));
    }

    @PutMapping("/admin/{id}/published")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceDetail setPublished(@PathVariable Long id, @RequestParam boolean published) {
        return mapper.toDetail(resources.setPublished(id, published));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        resources.delete(id);
    }

    // ── Request to draft ──────────────────────────────────────────────────────

    private ResourceService.Common toCommon(ResourceCommonRequest common) {
        return new ResourceService.Common(common.title(), common.summary(),
                common.categoryId(), common.tagIds(), common.coverId());
    }

    private ResourceService.VideoDraft toDraft(VideoRequest request) {
        return new ResourceService.VideoDraft(
                toCommon(request.common()), request.externalUrl(), request.durationSeconds());
    }

    /** The body is serialised back to text here: the service stores a document, not a tree. */
    private ResourceService.ArticleDraft toDraft(ArticleRequest request) {
        return new ResourceService.ArticleDraft(
                toCommon(request.common()), request.body().toString(), request.authorName());
    }
}
