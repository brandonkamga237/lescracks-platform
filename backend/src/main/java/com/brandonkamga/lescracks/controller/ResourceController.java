package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceMetadata;
import com.brandonkamga.lescracks.domain.ResourceSourceType;
import com.brandonkamga.lescracks.domain.ResourceType;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ResourceRequest;
import com.brandonkamga.lescracks.dto.ResourceResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.ResourceTypeRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resources")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Ressources", description = "API de gestion des ressources pédagogiques")
@SecurityRequirement(name = "bearerAuth")
public class ResourceController {

    private final ResourceService resourceService;
    private final CategoryRepository categoryRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final TagRepository tagRepository;

    @Value("${app.uploads.dir:uploads/resources}")
    private String uploadDirectory;

    public ResourceController(
            ResourceService resourceService,
            CategoryRepository categoryRepository,
            ResourceTypeRepository resourceTypeRepository,
            TagRepository tagRepository) {
        this.resourceService = resourceService;
        this.categoryRepository = categoryRepository;
        this.resourceTypeRepository = resourceTypeRepository;
        this.tagRepository = tagRepository;
    }

    /**
     * Get paginated and filtered resources.
     * Supports filtering by:
     * - type: resource type (VIDEO or DOCUMENT)
     * - categoryId: category ID
     * - tagIds: comma-separated list of tag IDs (filters resources having ANY of these tags)
     * - search: search term for title/description
     * 
     * Pagination:
     * - page: page number (0-based)
     * - size: page size
     * - sort: sorting criteria (e.g., createdAt,desc)
     */
    @GetMapping
    @Operation(summary = "Liste toutes les ressources avec pagination et filtres", 
               description = "Retourne la liste des ressources pédagogiques avec support de pagination et filtres. " +
               "Paramètres: type (VIDEO|DOCUMENT), categoryId, tagIds (comma-separated), search, page, size, sort")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Liste des ressources avec pagination")
    })
    public ResponseEntity<ApiResponse<PaginatedResourceResponse>> getAllResources(
            @Parameter(description = "Type de ressource (VIDEO ou DOCUMENT)") 
            @RequestParam(required = false) String type,
            
            @Parameter(description = "ID de la catégorie") 
            @RequestParam(required = false) Long categoryId,
            
            @Parameter(description = "IDs des tags séparés par des virgules (filtre OU)") 
            @RequestParam(required = false) String tagIds,
            
            @Parameter(description = "Terme de recherche dans le titre ou la description") 
            @RequestParam(required = false) String search,
            
            @Parameter(description = "Numéro de page (0-based)") 
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Taille de la page") 
            @RequestParam(defaultValue = "12") int size,
            
            @Parameter(description = "Tri (ex: createdAt,desc ou title,asc)") 
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        
        // Parse tagIds
        List<Long> tagIdList = null;
        if (tagIds != null && !tagIds.isEmpty()) {
            tagIdList = List.of(tagIds.split(",")).stream()
                    .map(String::trim)
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        }
        
        // Parse sort
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        
        // Use the unified search method — convert type to lowercase to match enum storage
        Page<Resource> resourcePage = resourceService.searchWithFilters(
                type != null ? type.toLowerCase() : null, categoryId, tagIdList, search, pageable);
        
        // Convert to response format
        List<ResourceResponse> content = resourcePage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        PaginatedResourceResponse response = new PaginatedResourceResponse(
                content,
                resourcePage.getNumber(),
                resourcePage.getSize(),
                resourcePage.getTotalElements(),
                resourcePage.getTotalPages(),
                resourcePage.isFirst(),
                resourcePage.isLast()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une ressource par ID", 
               description = "Retourne les détails d'une ressource spécifique.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Ressource trouvée"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Ressource non trouvée")
    })
    public ResponseEntity<ApiResponse<ResourceResponse>> getResourceById(
            @Parameter(description = "ID de la ressource", required = true) @PathVariable Long id) {
        return resourceService.findByIdOptional(id)
                .map(resource -> ResponseEntity.ok(ApiResponse.success(toResponse(resource))))
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Récupérer les ressources par catégorie avec pagination", 
               description = "Filtre les ressources par catégorie avec support de pagination.")
    public ResponseEntity<ApiResponse<PaginatedResourceResponse>> getResourcesByCategory(
            @Parameter(description = "ID de la catégorie", required = true) @PathVariable Long categoryId,
            @Parameter(description = "Numéro de page (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de la page") @RequestParam(defaultValue = "12") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Resource> resourcePage = resourceService.findByCategoryId(categoryId, pageable);
        
        List<ResourceResponse> content = resourcePage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        PaginatedResourceResponse response = new PaginatedResourceResponse(
                content, resourcePage.getNumber(), resourcePage.getSize(),
                resourcePage.getTotalElements(), resourcePage.getTotalPages(),
                resourcePage.isFirst(), resourcePage.isLast()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/type/{resourceTypeName}")
    @Operation(summary = "Récupérer les ressources par type avec pagination", 
               description = "Filtre les ressources par type (VIDEO ou DOCUMENT) avec support de pagination.")
    public ResponseEntity<ApiResponse<PaginatedResourceResponse>> getResourcesByType(
            @Parameter(description = "Type de ressource (VIDEO ou DOCUMENT)", required = true) 
            @PathVariable String resourceTypeName,
            @Parameter(description = "Numéro de page (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de la page") @RequestParam(defaultValue = "12") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Resource> resourcePage = resourceService.findByResourceTypeName(resourceTypeName.toLowerCase(), pageable);
        
        List<ResourceResponse> content = resourcePage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        PaginatedResourceResponse response = new PaginatedResourceResponse(
                content, resourcePage.getNumber(), resourcePage.getSize(),
                resourcePage.getTotalElements(), resourcePage.getTotalPages(),
                resourcePage.isFirst(), resourcePage.isLast()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/tags")
    @Operation(summary = "Récupérer les ressources par tags avec pagination", 
               description = "Filtre les ressources par tags (ressources ayant AU MOINS UN des tags) avec pagination.")
    public ResponseEntity<ApiResponse<PaginatedResourceResponse>> getResourcesByTags(
            @Parameter(description = "IDs des tags séparés par des virgules", required = true) 
            @RequestParam String tagIds,
            @Parameter(description = "Numéro de page (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de la page") @RequestParam(defaultValue = "12") int size) {
        
        List<Long> tagIdList = List.of(tagIds.split(",")).stream()
                .map(String::trim)
                .map(Long::parseLong)
                .collect(Collectors.toList());
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Resource> resourcePage = resourceService.findByTagsIn(tagIdList, pageable);
        
        List<ResourceResponse> content = resourcePage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        PaginatedResourceResponse response = new PaginatedResourceResponse(
                content, resourcePage.getNumber(), resourcePage.getSize(),
                resourcePage.getTotalElements(), resourcePage.getTotalPages(),
                resourcePage.isFirst(), resourcePage.isLast()
        );
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer une nouvelle ressource", 
               description = "Crée une nouvelle ressource pédagogique. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Ressource créée"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs")
    })
    public ResponseEntity<ApiResponse<ResourceResponse>> createResource(@Valid @RequestBody ResourceRequest request) {
        Resource resource = toEntity(request);
        Resource savedResource = resourceService.save(resource);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedResource), "Resource created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour une ressource", 
               description = "Met à jour une ressource existante. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Ressource mise à jour"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Ressource non trouvée")
    })
    public ResponseEntity<ApiResponse<ResourceResponse>> updateResource(
            @Parameter(description = "ID de la ressource", required = true) @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        
        if (!resourceService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Resource", "id", id);
        }

        Resource resource = toEntity(request);
        resource.setId(id);
        Resource savedResource = resourceService.save(resource);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedResource), "Resource updated successfully"));
    }

    // ── File upload ──────────────────────────────────────────────────────────────

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Uploader un fichier ressource",
               description = "Stocke le fichier sur la plateforme et retourne son URL publique. Réservé aux administrateurs.")
    public ResponseEntity<ApiResponse<String>> uploadFile(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new com.brandonkamga.lescracks.exception.BadRequestException("Le fichier est vide");
        }
        String url = resourceService.storeFile(
                file.getOriginalFilename(),
                file.getBytes(),
                file.getContentType());
        return ResponseEntity.ok(ApiResponse.success(url, "Fichier uploadé avec succès"));
    }

    // ── Serve uploaded files ─────────────────────────────────────────────────────

    @GetMapping("/files/{filename:.+}")
    @Operation(summary = "Télécharger / visualiser un fichier uploadé",
               description = "Sert les fichiers stockés localement sur la plateforme.")
    public ResponseEntity<org.springframework.core.io.Resource> serveFile(
            @PathVariable String filename) throws MalformedURLException {
        Path filePath = Paths.get(uploadDirectory).resolve(filename).normalize();
        org.springframework.core.io.Resource fileResource = new org.springframework.core.io.UrlResource(filePath.toUri());
        if (!fileResource.exists()) {
            throw new com.brandonkamga.lescracks.exception.ResourceNotFoundException("File", "name", filename);
        }
        String contentType = "application/octet-stream";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(fileResource);
    }

    // ── Tracking ────────────────────────────────────────────────────────────────

    @PostMapping("/{id}/view")
    @Operation(summary = "Enregistrer une vue sur une ressource",
               description = "Incrémente atomiquement le compteur de vues.")
    public ResponseEntity<ApiResponse<Void>> trackView(@PathVariable Long id) {
        if (!resourceService.findByIdOptional(id).isPresent()) {
            throw new com.brandonkamga.lescracks.exception.ResourceNotFoundException("Resource", "id", id);
        }
        resourceService.incrementViewCount(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/download")
    @Operation(summary = "Enregistrer un téléchargement et récupérer l'URL",
               description = "Incrémente le compteur de téléchargements et retourne l'URL de la ressource.")
    public ResponseEntity<ApiResponse<String>> trackDownload(@PathVariable Long id) {
        Resource resource = resourceService.findByIdOptional(id)
                .orElseThrow(() -> new com.brandonkamga.lescracks.exception.ResourceNotFoundException("Resource", "id", id));
        if (!resource.isDownloadable()) {
            throw new com.brandonkamga.lescracks.exception.BadRequestException("Le téléchargement n'est pas autorisé pour cette ressource");
        }
        resourceService.incrementDownloadCount(id);
        return ResponseEntity.ok(ApiResponse.success(resource.getUrl(), "Téléchargement autorisé"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une ressource", 
               description = "Supprime une ressource. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Ressource supprimée"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Ressource non trouvée")
    })
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @Parameter(description = "ID de la ressource", required = true) @PathVariable Long id) {
        if (!resourceService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Resource", "id", id);
        }
        resourceService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Resource deleted successfully"));
    }

    private Resource toEntity(ResourceRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        
        ResourceType resourceType = resourceTypeRepository.findById(request.getResourceTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("ResourceType", "id", request.getResourceTypeId()));

        Set<Tag> tags = new HashSet<>();
        if (request.getTagIds() != null) {
            tags = new HashSet<>(tagRepository.findAllById(request.getTagIds()));
        }

        ResourceSourceType sourceType = ResourceSourceType.EXTERNAL;
        if (request.getSourceType() != null) {
            try { sourceType = ResourceSourceType.valueOf(request.getSourceType().toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        Resource resource = Resource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .url(request.getUrl() != null ? request.getUrl() : "")
                .previewImageUrl(request.getPreviewImageUrl())
                .sourceType(sourceType)
                .premium(request.isPremium())
                .downloadable(request.isDownloadable())
                .category(category)
                .resourceType(resourceType)
                .tags(tags)
                .createdAt(LocalDateTime.now())
                .build();

        // Create metadata if provided
        if (request.getFileSize() != null || request.getMimeType() != null) {
            ResourceMetadata metadata = ResourceMetadata.builder()
                    .fileSize(request.getFileSize())
                    .mimeType(request.getMimeType())
                    .resource(resource)
                    .build();
            resource.setMetadata(metadata);
        }

        return resource;
    }

    private ResourceResponse toResponse(Resource resource) {
        Set<ResourceResponse.TagDto> tags = resource.getTags().stream()
                .map(tag -> ResourceResponse.TagDto.builder()
                        .id(tag.getId())
                        .name(tag.getName())
                        .build())
                .collect(Collectors.toSet());

        ResourceResponse.ResourceMetadataDto metadataDto = null;
        if (resource.getMetadata() != null) {
            metadataDto = ResourceResponse.ResourceMetadataDto.builder()
                    .fileSize(resource.getMetadata().getFileSize())
                    .mimeType(resource.getMetadata().getMimeType())
                    .build();
        }

        return ResourceResponse.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .url(resource.getUrl())
                .previewImageUrl(resource.getPreviewImageUrl())
                .sourceType(resource.getSourceType() != null ? resource.getSourceType().name() : ResourceSourceType.EXTERNAL.name())
                .premium(resource.isPremium())
                .downloadable(resource.isDownloadable())
                .viewCount(resource.getViewCount())
                .downloadCount(resource.getDownloadCount())
                .createdAt(resource.getCreatedAt())
                .categoryId(resource.getCategory().getId())
                .categoryName(resource.getCategory().getName())
                .resourceTypeId(resource.getResourceType().getId())
                .resourceTypeName(resource.getResourceType().getName().name().toUpperCase())
                .tags(tags)
                .metadata(metadataDto)
                .build();
    }

    /**
     * DTO for paginated resource responses
     */
    public static class PaginatedResourceResponse {
        private List<ResourceResponse> content;
        private int number;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean first;
        private boolean last;

        public PaginatedResourceResponse(List<ResourceResponse> content, int number, int size, 
                long totalElements, int totalPages, boolean first, boolean last) {
            this.content = content;
            this.number = number;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.first = first;
            this.last = last;
        }

        public List<ResourceResponse> getContent() { return content; }
        public void setContent(List<ResourceResponse> content) { this.content = content; }
        public int getNumber() { return number; }
        public void setNumber(int number) { this.number = number; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public long getTotalElements() { return totalElements; }
        public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
        public boolean isFirst() { return first; }
        public void setFirst(boolean first) { this.first = first; }
        public boolean isLast() { return last; }
        public void setLast(boolean last) { this.last = last; }
    }
}
