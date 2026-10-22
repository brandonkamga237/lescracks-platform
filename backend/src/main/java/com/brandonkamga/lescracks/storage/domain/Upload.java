package com.brandonkamga.lescracks.storage.domain;

/** A file sent with a form, read out of the HTTP request so no use case depends on servlet types. */
public record Upload(String originalName, String contentType, byte[] content) {

    public boolean isEmpty() {
        return content == null || content.length == 0;
    }
}
