package com.brandonkamga.lescracks.storage.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

/** The cover of an article or an event: stored on the platform, or a URL already given. */
public final class CoverImages {

    private static final String PREFIX = "/api/files/";
    private static final int MAX_BYTES = 5 * 1024 * 1024;

    private CoverImages() {
    }

    /** An uploaded file wins over a URL, which wins over the current cover; with none of them, it is refused. */
    public static String resolve(StorageService storage, Upload upload, String url, String current) {
        String cover = resolveOptional(storage, upload, url, current);
        if (cover == null) throw new BadRequestException("L'image de couverture est obligatoire.");
        return cover;
    }

    /** Same precedence, for content whose cover may stay empty (an event). */
    public static String resolveOptional(StorageService storage, Upload upload, String url, String current) {
        if (upload != null && !upload.isEmpty()) {
            if (upload.contentType() == null || !upload.contentType().startsWith("image/")) {
                throw new BadRequestException("L'image de couverture doit être au format image (jpg, png, webp, …).");
            }
            if (upload.content().length > MAX_BYTES) {
                throw new BadRequestException("L'image de couverture ne doit pas dépasser 5 Mo.");
            }
            return PREFIX + storage.store(upload.originalName(), upload.content(), upload.contentType());
        }
        if (url != null && !url.isBlank()) return url.trim();
        if (current != null && !current.isBlank()) return current;
        return null;
    }

    /** Deletes a cover stored on the platform; an outside URL is not ours to delete. */
    public static void discard(StorageService storage, String cover) {
        if (cover == null || !cover.startsWith(PREFIX)) return;
        String key = cover.substring(PREFIX.length());
        if (!key.isBlank()) storage.delete(key);
    }
}
