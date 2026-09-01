package com.brandonkamga.lescracks.exception;

import org.springframework.http.HttpStatus;

/** The request assumed a state the server is not in: already decided, already issued. */
public class ConflictException extends AppException {

    public ConflictException(String message) {
        super(message, ErrorCode.CONFLICT, HttpStatus.CONFLICT);
    }
}
