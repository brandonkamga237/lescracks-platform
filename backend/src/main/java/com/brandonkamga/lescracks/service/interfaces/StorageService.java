package com.brandonkamga.lescracks.service.interfaces;

import java.util.Optional;

/**
 * Object storage for uploaded files.
 *
 * Callers deal in opaque keys and never learn where the bytes live, so the backing store can
 * change without touching the resource or user code that uploads through it.
 */
public interface StorageService {

    /** Stores the bytes under a generated key and returns that key. */
    String store(String originalFileName, byte[] bytes, String contentType);

    /** Reads an object back, or empty when the key is unknown to this store. */
    Optional<StoredObject> read(String key);

    void delete(String key);

    record StoredObject(byte[] content, String contentType, long size) {
    }
}
