package com.brandonkamga.lescracks.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends AppException {

    public NotFoundException(String message) {
        super(message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    /** "Event introuvable (slug = spring-boot)." — enough to debug, nothing internal leaked. */
    public NotFoundException(String what, String field, Object value) {
        this(what + " introuvable (" + field + " = " + value + ").");
    }
}
