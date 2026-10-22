package com.brandonkamga.lescracks.storage.api;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.storage.domain.Upload;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/** Reads a multipart file into an {@link Upload}, so controllers hand use cases no servlet type. */
public final class Uploads {

    private Uploads() {
    }

    public static Upload of(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            return new Upload(file.getOriginalFilename(), file.getContentType(), file.getBytes());
        } catch (IOException exception) {
            throw new BadRequestException("Le fichier envoyé n'a pas pu être lu.");
        }
    }
}
