package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.User;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The local side of an identity Keycloak owns.
 *
 * There is no sign-up here and no password: a row appears the first time a valid token is
 * seen, so the rest of the model has something to point at.
 */
public interface UserService {

    /** Finds or creates the row behind a token, refreshing what the token says has changed. */
    User fromToken(Jwt token);

    User require(Long id);

    User requireBySubject(String subject);
}
