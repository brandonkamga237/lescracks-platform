package com.brandonkamga.lescracks.dto.common;

import com.brandonkamga.lescracks.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/**
 * What a failed request answers with.
 *
 * {@code code} is what a client branches on; {@code message} is what a person reads.
 * {@code reference} appears only on faults the caller cannot fix, and is the same string
 * printed beside the stack trace — a bug report quoting it points straight at the log line.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        ErrorCode code,
        String message,
        String path,
        Instant timestamp,
        /** Field name to message, on validation failures only. */
        Map<String, String> fields,
        String reference) {

    public static ApiError of(ErrorCode code, String message, String path) {
        return new ApiError(code, message, path, Instant.now(), null, null);
    }

    public static ApiError fields(String message, String path, Map<String, String> fields) {
        return new ApiError(ErrorCode.VALIDATION_FAILED, message, path, Instant.now(), fields, null);
    }

    public static ApiError referenced(ErrorCode code, String message, String path, String reference) {
        return new ApiError(code, message, path, Instant.now(), null, reference);
    }
}
