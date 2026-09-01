package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.dto.user.UserResponse;
import com.brandonkamga.lescracks.mapper.UserMapper;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The local side of an identity Keycloak owns.
 *
 * There is no sign-up, no password change and no account deletion here: those are Keycloak's
 * screens. What this offers is the row the rest of the model points at, created on the first
 * valid token and refreshed from the claims when they change.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "Compte")
public class UserController {

    private final UserService users;
    private final UserMapper mapper;

    public UserController(UserService users, UserMapper mapper) {
        this.users = users;
        this.mapper = mapper;
    }

    @GetMapping("/me")
    @Operation(summary = "Mon compte")
    public UserResponse me(@AuthenticationPrincipal Jwt token) {
        return mapper.toResponse(users.fromToken(token));
    }
}
