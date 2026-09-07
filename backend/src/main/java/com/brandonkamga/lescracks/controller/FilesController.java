package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

/**
 * Serves uploaded objects back to readers and to the SPA. Objects are identified by
 * their storage key; the caller never builds a direct MinIO URL.
 */
@RestController
@RequestMapping("/api/files")
public class FilesController {
    private final StorageService storage;

    public FilesController(StorageService storage) {
        this.storage = storage;
    }

    @GetMapping("/{key}")
    public void download(@PathVariable String key, HttpServletResponse response) throws IOException {
        Optional<StorageService.StoredObject> stored = storage.read(key);
        if (stored.isEmpty()) throw new NotFoundException("Fichier", "clé", key);

        StorageService.StoredObject object = stored.get();
        response.setContentType(object.contentType() != null ? object.contentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setContentLengthLong(object.size());
        try (InputStream in = object.content(); var out = response.getOutputStream()) {
            in.transferTo(out);
        }
    }
}
