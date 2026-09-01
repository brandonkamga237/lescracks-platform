package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.dto.media.MediaResponse;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import org.springframework.stereotype.Component;

/**
 * Turns a stored image into something a browser can fetch.
 *
 * This is the only place a key becomes a url, which is what keeps the location out of the
 * database and lets storage move without rewriting a single row.
 */
@Component
public class MediaMapper {

    private final MediaService media;

    public MediaMapper(MediaService media) {
        this.media = media;
    }

    /** Null in, null out: a missing cover is absent from the payload, not an empty object. */
    public MediaResponse toResponse(Media source) {
        if (source == null) {
            return null;
        }
        return new MediaResponse(
                source.getId(),
                media.urlFor(source),
                source.getWidth(),
                source.getHeight(),
                source.getOriginalName());
    }
}
