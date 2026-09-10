package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/upload")
public class AdminUploadController {

    private final StorageService storage;

    public AdminUploadController(StorageService storage) {
        this.storage = storage;
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse uploadImage(
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "file-0", required = false) MultipartFile file0) {
        MultipartFile file = (image != null && !image.isEmpty()) ? image : file0;
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Aucune image n'a été envoyée.");
        }
        try {
            String key = storage.store(file.getOriginalFilename(), file.getBytes(),
                    file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            String url = "/api/files/" + key;
            var result = new ImageResult(url, file.getOriginalFilename(), file.getSize());
            return new UploadResponse(url, java.util.List.of(result));
        } catch (IOException exception) {
            throw new BadRequestException("L'image n'a pas pu être lue.");
        }
    }

    public record ImageResult(String url, String name, long size) {
    }

    public record UploadResponse(String url, java.util.List<ImageResult> result) {
    }
}
