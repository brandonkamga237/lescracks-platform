package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.mapper.MediaMapper;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

/**
 * Images: uploaded by admins, served to everyone.
 *
 * Serving through the API rather than exposing the bucket keeps the storage location out of
 * every page that was ever rendered, which is what makes moving it possible later.
 */
@RestController
@RequestMapping("/api/media")
@Tag(name = "Images")
public class MediaController {

    private final MediaService media;
    private final StorageService storage;
    private final MediaMapper mapper;

    public MediaController(MediaService media, StorageService storage, MediaMapper mapper) {
        this.media = media;
        this.storage = storage;
        this.mapper = mapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Téléverser une image")
    public MediaResponse upload(@RequestParam("file") MultipartFile file) {
        return mapper.toResponse(media.upload(file));
    }

    /**
     * Keyed by object key rather than id: the key is already unique and unguessable, and it
     * lets a client cache hard without a version parameter, since a key never changes content.
     */
    @GetMapping("/{key}")
    @Operation(summary = "Servir une image")
    public ResponseEntity<InputStreamResource> serve(@PathVariable String key) {
        var stored = storage.read(key)
                .orElseThrow(() -> new NotFoundException("Image", "key", key));

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(stored.contentType()))
                .contentLength(stored.size())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(new InputStreamResource(stored.content()));
    }

    @DeleteMapping("/admin/sweep")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer les images que plus rien n'utilise")
    public int sweep(@RequestParam(defaultValue = "24") int olderThanHours) {
        return media.sweepUnreferenced(Duration.ofHours(olderThanHours));
    }
}
