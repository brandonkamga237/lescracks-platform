package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.PasswordResetTokenRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {
    private static final Duration VALIDITY = Duration.ofMinutes(30);

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final OneTimeTokens oneTimeTokens;
    private final PasswordEncoder passwords;
    private final Mailer mail;

    public PasswordResetServiceImpl(UserRepository users, PasswordResetTokenRepository tokens,
                                    OneTimeTokens oneTimeTokens, PasswordEncoder passwords, Mailer mail) {
        this.users = users;
        this.tokens = tokens;
        this.oneTimeTokens = oneTimeTokens;
        this.passwords = passwords;
        this.mail = mail;
    }

    @Override
    public void request(String email) {
        users.findByEmailIgnoreCase(email.trim())
                .filter(user -> user.getPasswordHash() != null)
                .ifPresent(user -> {
                    OneTimeTokens.Issued token = oneTimeTokens.issue();
                    tokens.save(PasswordResetToken.builder()
                            .user(user)
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
                .orElseThrow(() -> new BadRequestException("Le lien de réinitialisation est invalide ou expiré."));
        reset.getUser().setPasswordHash(passwords.encode(newPassword));
        reset.markUsed();
    }
}
