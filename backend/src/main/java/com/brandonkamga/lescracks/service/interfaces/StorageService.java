package com.brandonkamga.lescracks.service.interfaces;

import java.io.InputStream;
import java.util.Optional;

/**
 * Object storage, behind a seam.
 *
 * Callers hand over bytes and get back a key. They never learn where the object lives, which
 * is what lets the backing store change without touching anything that uploads.
 */
public interface StorageService {

    /** Stores the bytes under a generated key and returns it. */
    String store(String originalName, byte[] content, String contentType);

    Optional<StoredObject> read(String key);

    void delete(String key);

    /** A stored object and enough about it to serve it back honestly. */
    record StoredObject(InputStream content, String contentType, long size) {
    }
}
