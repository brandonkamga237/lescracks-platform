package com.brandonkamga.lescracks.shared.exception;

/** The request assumed a state the server is not in: already decided, already issued. */
public class ConflictException extends AppException {

    public ConflictException(String message) {
        super(message, ErrorCode.CONFLICT);
    }
}
