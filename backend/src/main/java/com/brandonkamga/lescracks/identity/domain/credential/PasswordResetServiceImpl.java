package com.brandonkamga.lescracks.identity.domain.credential;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import java.time.Duration;
import java.time.Instant;

public class PasswordResetServiceImpl implements PasswordResetService {
    private static final Duration VALIDITY = Duration.ofMinutes(30);
    private static final String INVALID = "Le lien de réinitialisation est invalide ou expiré.";

    private final UserStore users;
    private final PasswordResetTokenStore tokens;
    private final OneTimeTokens oneTimeTokens;
    private final PasswordHasher passwords;
    private final Mailer mail;

    public PasswordResetServiceImpl(UserStore users, PasswordResetTokenStore tokens,
                                    OneTimeTokens oneTimeTokens, PasswordHasher passwords, Mailer mail) {
        this.users = users;
        this.tokens = tokens;
        this.oneTimeTokens = oneTimeTokens;
        this.passwords = passwords;
        this.mail = mail;
    }

    @Override
    public void request(String email) {
        users.findByEmail(email.trim())
                .filter(user -> user.getPasswordHash() != null)
                .ifPresent(user -> {
                    OneTimeTokens.Issued token = oneTimeTokens.issue();
                    tokens.save(PasswordResetToken.builder()
                            .userId(user.getId())
                            .tokenHash(token.hash())
                            .expiresAt(Instant.now().plus(VALIDITY))
                            .build());
                    mail.send(new PasswordResetEmail(user.getEmail(), token.raw()));
                });
    }

    @Override
    public void reset(String token, String newPassword) {
        PasswordResetToken reset = tokens.findByTokenHash(oneTimeTokens.hash(token))
                .filter(PasswordResetToken::isValid)
                .orElseThrow(() -> new BadRequestException(INVALID));
        User user = users.findById(reset.getUserId()).orElseThrow(() -> new BadRequestException(INVALID));
        user.setPasswordHash(passwords.hash(newPassword));
        users.save(user);
        reset.markUsed();
        tokens.save(reset);
    }
}
