package com.brandonkamga.lescracks.identity.infra.security;

import com.brandonkamga.lescracks.identity.domain.external.IdentityClaims;
import com.brandonkamga.lescracks.identity.domain.external.IdentityTokenVerifier;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

/** Verifies provider tokens with the same decoder as the resource server: same keys, same rules. */
@Component
public class JwtIdentityTokenVerifier implements IdentityTokenVerifier {

    private final JwtDecoder decoder;

    public JwtIdentityTokenVerifier(JwtDecoder decoder) {
        this.decoder = decoder;
    }

    @Override
    public IdentityClaims verify(String token) {
        Jwt jwt;
        try {
            jwt = decoder.decode(token);
        } catch (JwtException | IllegalArgumentException refused) {
            throw new BadRequestException("Jeton d'identité invalide ou expiré.");
        }
        Object verified = jwt.getClaim("email_verified");
        return new IdentityClaims(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                verified instanceof Boolean flag ? flag : null,
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("family_name"),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("preferred_username"));
    }
}
