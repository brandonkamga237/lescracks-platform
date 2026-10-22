package com.brandonkamga.lescracks.shared.exception;

public class ForbiddenException extends AppException {

    public ForbiddenException(String message) {
        super(message, ErrorCode.FORBIDDEN);
    }
}
