package com.brandonkamga.lescracks.identity.domain.external;

public interface IdentityTokenVerifier {

    /** The claims of a token whose signature and expiry hold; refuses any other token with a 400. */
    IdentityClaims verify(String token);
}
