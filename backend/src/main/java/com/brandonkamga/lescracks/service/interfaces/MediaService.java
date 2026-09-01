package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Media;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

/**
 * Images: the ones covers point at, and the ones articles are written around.
 *
 * A {@link Media} row holds an object key, never a url. Turning a key into something a
 * browser can fetch is this service's job, so the day storage moves, nothing stored changes.
 */
public interface MediaService {

    /** Validates the file is an image the platform accepts, stores it, records the row. */
    Media upload(MultipartFile file);

    Media require(Long id);

    /** Where a browser should fetch it. Derived, never persisted. */
    String urlFor(Media media);

    /**
     * Deletes images nothing references and older than the grace period, which exists so an
     * upload still being written into a draft is not swept from under the writer.
     */
    int sweepUnreferenced(Duration olderThan);

    List<String> acceptedTypes();
}
