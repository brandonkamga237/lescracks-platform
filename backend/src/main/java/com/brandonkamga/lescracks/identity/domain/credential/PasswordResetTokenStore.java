package com.brandonkamga.lescracks.identity.domain.credential;

import java.util.Optional;

public interface PasswordResetTokenStore {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    PasswordResetToken save(PasswordResetToken token);
}
