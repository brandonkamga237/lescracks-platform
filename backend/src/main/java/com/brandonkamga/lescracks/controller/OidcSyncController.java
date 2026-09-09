package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.dto.auth.OidcSyncRequest;
import com.brandonkamga.lescracks.dto.user.UserProfileResponse;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.service.interfaces.OidcSyncService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/oidc")
public class OidcSyncController {

    private final OidcSyncService oidc;

    public OidcSyncController(OidcSyncService oidc) { this.oidc = oidc; }

    @PostMapping("/sync")
    public ResponseEntity<UserProfileResponse> sync(Authentication authentication,
                                                    @Valid @RequestBody OidcSyncRequest request) {
        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof Jwt jwt)) {
            throw new BadRequestException("Jeton OIDC invalide.");
        }
        var user = oidc.sync(jwt, request.provider());
        return ResponseEntity.ok(new UserProfileResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.isEmailVerified(), user.getProvider(), user.getCreatedAt()));
    }
}
