package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.resource.api.dto.ArticleResourceRequest;
import com.brandonkamga.lescracks.resource.api.dto.EbookResourceRequest;
import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.api.dto.VideoResourceRequest;
import com.brandonkamga.lescracks.resource.domain.Ebook;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceMapper;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.infra.EbookRepository;
import com.brandonkamga.lescracks.resource.infra.PdfExcerpts;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.storage.domain.StorageService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Ressources")
public class ResourceController {
    private final ResourceService resources;
    private final ResourceMapper mapper;
    private final EbookRepository ebooks;
    private final StorageService storage;
    private final PdfExcerpts excerpts;

    /** Pages shown in an ebook's preview; reading further means downloading it. */
    static final int PREVIEW_PAGES = 5;

    public ResourceController(ResourceService resources, ResourceMapper mapper,
                              EbookRepository ebooks, StorageService storage, PdfExcerpts excerpts) {
        this.resources = resources;
        this.mapper = mapper;
        this.ebooks = ebooks;
        this.storage = storage;
        this.excerpts = excerpts;
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

    @GetMapping("/{slug}")
    @Operation(summary = "Consulter une ressource publiée")
    public ResourceResponse get(@PathVariable String slug) {
        return mapper.toResponse(resources.requirePublishedBySlugOrId(slug));
    }

    /** Preview of a PDF ebook, open to everyone: its first pages, with the full length in X-Total-Pages. */
    @GetMapping("/{id}/preview")
    @Operation(summary = "Aperçu des premières pages d'un ebook PDF")
    public ResponseEntity<byte[]> preview(@PathVariable Long id) {
        resources.requirePublished(id);
        Ebook ebook = ebooks.findByResourceId(id)
                .orElseThrow(() -> new NotFoundException("Cette ressource n'est pas un ebook."));
        if (!ebook.getDocument().getFormat().toLowerCase().contains("pdf")) {
            throw new BadRequestException("L'aperçu n'existe que pour les ebooks au format PDF.");
        }
        var stored = storage.read(ebook.getDocument().getFile())
                .orElseThrow(() -> new NotFoundException("Fichier", "id", id));
        PdfExcerpts.Excerpt excerpt = excerpts.firstPages(stored.content(), PREVIEW_PAGES);
        return ResponseEntity.ok()
                .header("X-Total-Pages", String.valueOf(excerpt.totalPages()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename("apercu.pdf").build().toString())
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)))
                .contentType(MediaType.APPLICATION_PDF)
                .body(excerpt.bytes());
    }

    /** Members only (SecurityConfig). Fetched by the site's API client, so OIDC members send their token too. */
    @GetMapping("/{id}/download")
    @Operation(summary = "Télécharger un ebook publié")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) {
        Resource resource = resources.requirePublished(id);
        Ebook ebook = ebooks.findByResourceId(id)
                .orElseThrow(() -> new NotFoundException("Cette ressource n'est pas un ebook."));
        var stored = storage.read(ebook.getDocument().getFile())
                .orElseThrow(() -> new NotFoundException("Fichier", "id", id));
        String filename = resource.getTitle() + extension(ebook.getDocument().getFormat());
        ContentDisposition disposition = ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
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

    @PostMapping(value = "/admin/articles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createArticle(@Valid @RequestPart("data") ArticleResourceRequest request,
                                          @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.createArticle(request, coverImageFile));
    }

    @PutMapping(value = "/admin/articles/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateArticle(@PathVariable Long id,
                                          @Valid @RequestPart("data") ArticleResourceRequest request,
                                          @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return mapper.toResponse(resources.updateArticle(id, request, coverImageFile));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        resources.delete(id);
    }

    /** The saved file keeps a usable extension: an ebook named after its title alone opens with nothing. */
    private static String extension(String contentType) {
        return switch (contentType == null ? "" : contentType.toLowerCase()) {
            case "application/pdf" -> ".pdf";
            case "application/epub+zip" -> ".epub";
            case "application/zip" -> ".zip";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            default -> "";
        };
    }
}
