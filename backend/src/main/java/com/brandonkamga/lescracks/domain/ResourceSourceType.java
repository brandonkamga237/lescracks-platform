package com.brandonkamga.lescracks.domain;

/**
 * Distinguishes how a resource is stored / accessed.
 *
 * EXTERNAL – URL pointing to an outside service (YouTube, Google Drive, etc.)
 * UPLOADED – File physically stored on the platform (MinIO / local storage)
 */
public enum ResourceSourceType {
    EXTERNAL,
    UPLOADED
}
