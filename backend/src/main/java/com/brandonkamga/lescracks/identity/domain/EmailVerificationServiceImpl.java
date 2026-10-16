package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.EmailVerificationTokenRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.mail.domain.MailService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@Transactional
public class EmailVerificationServiceImpl implements EmailVerificationService {
    private static final Duration VALIDITY = Duration.ofHours(24);

    private final UserRepository users;
    private final EmailVerificationTokenRepository tokens;
    private final OneTimeTokens oneTimeTokens;
    private final MailService mail;

    public EmailVerificationServiceImpl(UserRepository users, EmailVerificationTokenRepository tokens,
                                        OneTimeTokens oneTimeTokens, MailService mail) {
        this.users = users;
        this.tokens = tokens;
        this.oneTimeTokens = oneTimeTokens;
        this.mail = mail;
    }

    @Override
    public void send(User user) {
        OneTimeTokens.Issued token = oneTimeTokens.issue();
        tokens.save(EmailVerificationToken.builder()
                .user(user)
                .tokenHash(token.hash())
                .expiresAt(Instant.now().plus(VALIDITY))
                .build());
        mail.sendVerificationEmail(user.getEmail(), token.raw(), user.getFirstName());
    }

    @Override
    public void verify(String token) {
        EmailVerificationToken verification = tokens.findByTokenHash(oneTimeTokens.hash(token))
                .filter(EmailVerificationToken::isValid)
                .orElseThrow(() -> new BadRequestException("Le lien de vérification est invalide ou expiré."));
        verification.getUser().setEmailVerified(true);
        verification.markUsed();
    }

    @Override
    public void resend(String email) {
        users.findByEmailIgnoreCase(email.trim()).ifPresent(this::send);
    }
}
