package com.brandonkamga.lescracks.identity.domain.signup;

import java.util.Optional;

public interface EmailVerificationTokenStore {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    /** The latest link sent to this user, if any. */
    Optional<EmailVerificationToken> findLatest(Long userId);

    EmailVerificationToken save(EmailVerificationToken token);
}
