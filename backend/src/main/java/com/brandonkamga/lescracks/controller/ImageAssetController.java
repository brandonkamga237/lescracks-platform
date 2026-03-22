package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ImageAsset;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ImageAssetRequest;
import com.brandonkamga.lescracks.dto.ImageAssetResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.ImageAssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/image-assets")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Images", description = "API de gestion des assets images")
@SecurityRequirement(name = "bearerAuth")
public class ImageAssetController {

    private final ImageAssetService imageAssetService;
    private final UserRepository userRepository;

    public ImageAssetController(
            ImageAssetService imageAssetService,
            UserRepository userRepository) {
        this.imageAssetService = imageAssetService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Liste tous les assets images", 
               description = "Retourne la liste de tous les assets images. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Liste des images"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit")
    })
    public ResponseEntity<ApiResponse<List<ImageAssetResponse>>> getAllImageAssets() {
        List<ImageAssetResponse> imageAssets = imageAssetService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(imageAssets));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une image par ID", description = "Retourne les détails d'une image.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Image trouvée"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Image non trouvée")
    })
    public ResponseEntity<ApiResponse<ImageAssetResponse>> getImageAssetById(
            @Parameter(description = "ID de l'image", required = true) @PathVariable Long id) {
        return imageAssetService.findByIdOptional(id)
                .map(imageAsset -> ResponseEntity.ok(ApiResponse.success(toResponse(imageAsset))))
                .orElseThrow(() -> new ResourceNotFoundException("ImageAsset", "id", id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Récupérer l'image de profil d'un utilisateur")
    public ResponseEntity<ApiResponse<ImageAssetResponse>> getImageAssetByUser(
            @Parameter(description = "ID de l'utilisateur", required = true) @PathVariable Long userId) {
        return imageAssetService.findByUserId(userId)
                .map(imageAsset -> ResponseEntity.ok(ApiResponse.success(toResponse(imageAsset))))
                .orElseThrow(() -> new ResourceNotFoundException("ImageAsset", "userId", userId));
    }

    @GetMapping("/type/{imageType}")
    @Operation(summary = "Récupérer les images par type", description = "Filtre les images par type.")
    public ResponseEntity<ApiResponse<List<ImageAssetResponse>>> getImageAssetsByType(
            @Parameter(description = "Type d'image", required = true) @PathVariable String imageType) {
        List<ImageAssetResponse> imageAssets = imageAssetService.findByImageType(imageType).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(imageAssets));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouveau asset image")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Image créée")
    })
    public ResponseEntity<ApiResponse<ImageAssetResponse>> createImageAsset(@Valid @RequestBody ImageAssetRequest request) {
        ImageAsset imageAsset = toEntity(request);
        ImageAsset savedImageAsset = imageAssetService.save(imageAsset);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedImageAsset), "ImageAsset created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour une image")
    public ResponseEntity<ApiResponse<ImageAssetResponse>> updateImageAsset(
            @Parameter(description = "ID de l'image", required = true) @PathVariable Long id,
            @Valid @RequestBody ImageAssetRequest request) {
        
        if (!imageAssetService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("ImageAsset", "id", id);
        }

        ImageAsset imageAsset = toEntity(request);
        imageAsset.setId(id);
        ImageAsset savedImageAsset = imageAssetService.save(imageAsset);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedImageAsset), "ImageAsset updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une image")
    public ResponseEntity<ApiResponse<Void>> deleteImageAsset(
            @Parameter(description = "ID de l'image", required = true) @PathVariable Long id) {
        if (!imageAssetService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("ImageAsset", "id", id);
        }
        imageAssetService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "ImageAsset deleted successfully"));
    }

    private ImageAsset toEntity(ImageAssetRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        }

        return ImageAsset.builder()
                .url(request.getUrl())
                .imageType(request.getImageType())
                .fileSize(request.getFileSize())
                .mimeType(request.getMimeType())
                .user(user)
                .build();
    }

    private ImageAssetResponse toResponse(ImageAsset imageAsset) {
        return ImageAssetResponse.builder()
                .id(imageAsset.getId())
                .url(imageAsset.getUrl())
                .imageType(imageAsset.getImageType())
                .fileSize(imageAsset.getFileSize())
                .mimeType(imageAsset.getMimeType())
                .userId(imageAsset.getUser() != null ? imageAsset.getUser().getId() : null)
                .build();
    }
}
