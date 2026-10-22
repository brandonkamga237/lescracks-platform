package com.brandonkamga.lescracks.shared.exception;

/**
 * Anything the application refuses on purpose.
 *
 * Carrying the code on the exception means the handler translates rather than decides: there is
 * no second place where someone picks a 400 for what the thrower meant as a 409, and no controller
 * setting a status by hand. No HTTP type in here: domains throw these, and a domain knows nothing
 * of the web.
 */
public abstract class AppException extends RuntimeException {

    private final ErrorCode code;

    protected AppException(String message, ErrorCode code) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
