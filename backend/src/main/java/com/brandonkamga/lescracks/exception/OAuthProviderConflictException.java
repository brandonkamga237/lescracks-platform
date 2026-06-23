package com.brandonkamga.lescracks.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class OAuthProviderConflictException extends RuntimeException {

    public OAuthProviderConflictException(String message) {
        super(message);
    }
}
