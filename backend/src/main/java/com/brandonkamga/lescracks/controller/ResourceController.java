package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Ebook;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.dto.resource.*;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.mapper.ResourceMapper;
import com.brandonkamga.lescracks.repository.EbookRepository;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.domain.ResourceStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Ressources")
public class ResourceController {
    private final ResourceService resources;
    private final ResourceMapper mapper;
    private final EbookRepository ebooks;
    private final StorageService storage;

    public ResourceController(ResourceService resources, ResourceMapper mapper,
                              EbookRepository ebooks, StorageService storage) {
        this.resources = resources;
        this.mapper = mapper;
        this.ebooks = ebooks;
        this.storage = storage;
    }

    @GetMapping
    @Operation(summary = "Consulter les ressources publiées")
    public PageResponse<ResourceResponse> published(@RequestParam(required = false) String kind,
                                                    @RequestParam(required = false) String search,
                                                    @RequestParam(required = false) Long categoryId,
                                                    @RequestParam(required = false) Long tagId,
                                                    @PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(resources.search(ResourceStatus.PUBLISHED, search, kind, categoryId, tagId, pageable), mapper::toResponse);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter une ressource publiée")
    public ResourceResponse get(@PathVariable Long id) {
        return mapper.toResponse(resources.requirePublished(id));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Télécharger un ebook publié")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) {
        Resource resource = resources.requirePublished(id);
        Ebook ebook = ebooks.findByResourceId(id)
                .orElseThrow(() -> new NotFoundException("Cette ressource n'est pas un ebook."));
        var stored = storage.read(ebook.getDocument().getFile())
                .orElseThrow(() -> new NotFoundException("Fichier", "id", id));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getTitle() + "\"")
                .contentType(MediaType.parseMediaType(ebook.getDocument().getFormat()))
                .contentLength(stored.size())
                .body(new InputStreamResource(stored.content()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ResourceResponse> all(@RequestParam(required = false) ResourceStatus status,
                                              @RequestParam(required = false) String kind,
                                              @RequestParam(required = false) String search,
                                              @RequestParam(required = false) Long categoryId,
                                              @RequestParam(required = false) Long tagId,
                                              @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(resources.search(status, search, kind, categoryId, tagId, pageable), mapper::toResponse);
    }

    @PostMapping(value = "/admin/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createVideo(@Valid @RequestPart("data") VideoResourceRequest request,
                                        @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.createVideo(request, coverImageFile));
    }

    @PutMapping(value = "/admin/videos/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateVideo(@PathVariable Long id,
                                        @Valid @RequestPart("data") VideoResourceRequest request,
                                        @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.updateVideo(id, request, coverImageFile));
    }

    @PostMapping(value = "/admin/ebooks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createEbook(@Valid @RequestPart("data") EbookResourceRequest request,
                                        @RequestPart("file") MultipartFile file,
                                        @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.createEbook(request, file, coverImageFile));
    }

    @PutMapping(value = "/admin/ebooks/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateEbook(@PathVariable Long id,
                                       @Valid @RequestPart("data") EbookResourceRequest request,
                                       @RequestPart(value = "file", required = false) MultipartFile file,
                                       @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.updateEbook(id, request, file, coverImageFile));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        resources.delete(id);
    }
}
