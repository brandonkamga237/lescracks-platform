package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.OidcSyncRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileResponse;
import com.brandonkamga.lescracks.identity.domain.OidcSyncService;
import com.brandonkamga.lescracks.identity.domain.UserIdentityService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.AbstractOAuth2TokenAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/oidc")
public class OidcSyncController {

    private final OidcSyncService oidc;
    private final UserIdentityService identities;

    public OidcSyncController(OidcSyncService oidc, UserIdentityService identities) {
        this.oidc = oidc;
        this.identities = identities;
    }

    @PostMapping("/sync")
    public ResponseEntity<UserProfileResponse> sync(Authentication authentication,
                                                    @Valid @RequestBody OidcSyncRequest request) {
        Jwt jwt = extractJwt(authentication);
        if (jwt == null) {
            throw new BadRequestException("La synchronisation de ton profil a échoué.");
        }
        var user = oidc.sync(jwt, request.provider());
        return ResponseEntity.ok(new UserProfileResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.isEmailVerified(), user.getProvider(), user.getCreatedAt(),
                user.getUsername(), user.getAvatarUrl(), user.getBio(), user.getLocation(), user.getSocialLinks(),
                identities.list(user.getEmail())));
    }

    private static Jwt extractJwt(Authentication authentication) {
        if (authentication instanceof AbstractOAuth2TokenAuthenticationToken<?> tokenAuthentication
                && tokenAuthentication.getToken() instanceof Jwt jwt) {
            return jwt;
        }
        if (authentication.getCredentials() instanceof Jwt jwt) {
            return jwt;
        }
        return null;
    }
}
