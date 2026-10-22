package com.brandonkamga.lescracks.shared.exception;

/** Credentials were refused: the caller has to sign in again, differently. */
public class UnauthenticatedException extends AppException {

    public UnauthenticatedException(String message) {
        super(message, ErrorCode.UNAUTHENTICATED);
    }
}
