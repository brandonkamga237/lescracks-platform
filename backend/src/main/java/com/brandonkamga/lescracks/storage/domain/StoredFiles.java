package com.brandonkamga.lescracks.storage.domain;

/** Where a stored object can be fetched by a browser, given what callers keep in the database. */
public final class StoredFiles {
    private StoredFiles() {
    }

    /**
     * A storage key becomes its public path under /api/files; an absolute URL or a path that is
     * already public is returned as it is. Blank means no file.
     */
    public static String publicPath(String keyOrUrl) {
        if (keyOrUrl == null || keyOrUrl.isBlank()) return null;
        return keyOrUrl.startsWith("http") || keyOrUrl.startsWith("/") ? keyOrUrl : "/api/files/" + keyOrUrl;
    }
}
