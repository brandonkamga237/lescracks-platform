package com.brandonkamga.lescracks.member.api;

import com.brandonkamga.lescracks.account.application.ExternalIdentityService;
import com.brandonkamga.lescracks.account.application.OidcSyncService;
import com.brandonkamga.lescracks.member.api.dto.OidcSyncRequest;
import com.brandonkamga.lescracks.member.api.dto.ProfileResponse;
import com.brandonkamga.lescracks.member.application.MemberView;
import com.brandonkamga.lescracks.member.application.ProfileService;
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

/** A Google or GitHub sign-in: the account is synced in account, and the answer is the member's profile. */
@RestController
@RequestMapping("/api/oidc")
public class OidcSyncController {
    private final OidcSyncService oidc;
    private final ProfileService profiles;
    private final ExternalIdentityService identities;

    public OidcSyncController(OidcSyncService oidc, ProfileService profiles, ExternalIdentityService identities) {
        this.oidc = oidc;
        this.profiles = profiles;
        this.identities = identities;
    }

    @PostMapping("/sync")
    public ResponseEntity<ProfileResponse> sync(Authentication authentication, @Valid @RequestBody OidcSyncRequest request) {
        Jwt jwt = extractJwt(authentication);
        if (jwt == null) {
            throw new BadRequestException("La synchronisation de ton profil a échoué.");
        }
        String email = oidc.sync(jwt.getTokenValue(), request.provider()).getEmail();
        MemberView view = profiles.view(email);
        return ResponseEntity.ok(ProfileResponse.of(view, identities.list(email)));
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
