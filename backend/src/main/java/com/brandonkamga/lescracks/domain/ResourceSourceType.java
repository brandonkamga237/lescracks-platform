package com.brandonkamga.lescracks.domain;

/**
 * Distinguishes how a resource is stored / accessed.
 *
 * EXTERNAL - URL pointing to an outside service (YouTube, Google Drive, etc.)
 * UPLOADED - File physically stored on the platform (MinIO / local storage)
 * INLINE   - Written in the back office; the body lives in Resource.content
 */
public enum ResourceSourceType {
    EXTERNAL,
    UPLOADED,
    INLINE
}
