package com.brandonkamga.lescracks.dto.media;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * An image as a client needs it: somewhere to fetch it, and how big it is.
 *
 * The object key never leaves the server. Width and height are here so a page can reserve the
 * space before the bytes arrive, instead of reflowing around them.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record MediaResponse(Long id, String url, Integer width, Integer height, String alt) {
}
