package com.brandonkamga.lescracks.exception;

import org.springframework.http.HttpStatus;

/**
 * Anything the application refuses on purpose.
 *
 * Carrying the status and the code on the exception means the handler translates rather than
 * decides: there is no second place where someone picks a 400 for what the thrower meant as a
 * 409, and no controller setting a status by hand.
 */
public abstract class AppException extends RuntimeException {

    private final ErrorCode code;
    private final HttpStatus status;

    protected AppException(String message, ErrorCode code, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public ErrorCode code() {
        return code;
    }

    public HttpStatus status() {
        return status;
    }
}
