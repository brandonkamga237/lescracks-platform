package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.IdentityClaims;

public interface IdentityTokenVerifier {

    /** The claims of a token whose signature and expiry hold; refuses any other token with a 400. */
    IdentityClaims verify(String token);
}
