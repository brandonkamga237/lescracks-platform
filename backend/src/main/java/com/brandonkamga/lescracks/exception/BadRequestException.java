package com.brandonkamga.lescracks.exception;

import org.springframework.http.HttpStatus;

/** The caller asked for something the rules do not allow, and can fix it. */
public class BadRequestException extends AppException {

    public BadRequestException(String message) {
        super(message, ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
    }
}
