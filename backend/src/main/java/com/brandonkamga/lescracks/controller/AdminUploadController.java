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
    public UploadResponse uploadImage(@RequestPart("image") MultipartFile image) {
        try {
            String key = storage.store(image.getOriginalFilename(), image.getBytes(),
                    image.getContentType() == null ? "application/octet-stream" : image.getContentType());
            return new UploadResponse("/api/files/" + key);
        } catch (IOException exception) {
            throw new BadRequestException("L'image n'a pas pu être lue.");
        }
    }

    public record UploadResponse(String url) {
    }
}
