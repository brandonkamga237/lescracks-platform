package com.brandonkamga.lescracks.identity.domain.signup;

import com.brandonkamga.lescracks.identity.domain.credential.OneTimeTokens;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.VerificationEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.time.Duration;
import java.time.Instant;

public class EmailVerificationServiceImpl implements EmailVerificationService {
    private static final Duration VALIDITY = Duration.ofHours(24);
    private static final Duration COOLDOWN = Duration.ofMinutes(1);
    private static final String INVALID = "Le lien de vérification est invalide ou expiré.";

    private final UserStore users;
    private final EmailVerificationTokenStore tokens;
    private final OneTimeTokens oneTimeTokens;
    private final Mailer mail;

    public EmailVerificationServiceImpl(UserStore users, EmailVerificationTokenStore tokens,
                                        OneTimeTokens oneTimeTokens, Mailer mail) {
        this.users = users;
        this.tokens = tokens;
        this.oneTimeTokens = oneTimeTokens;
        this.mail = mail;
    }

    @Override
    public void send(User user) {
        OneTimeTokens.Issued token = oneTimeTokens.issue();
        tokens.save(EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(token.hash())
                .expiresAt(Instant.now().plus(VALIDITY))
                .build());
        mail.send(new VerificationEmail(user.getEmail(), user.getFirstName(), token.raw()));
    }

    @Override
    public void verify(String token) {
        EmailVerificationToken verification = tokens.findByTokenHash(oneTimeTokens.hash(token))
                .filter(EmailVerificationToken::isValid)
                .orElseThrow(() -> new BadRequestException(INVALID));
        User user = users.findById(verification.getUserId()).orElseThrow(() -> new BadRequestException(INVALID));
        user.setEmailVerified(true);
        users.save(user);
        verification.markUsed();
        tokens.save(verification);
    }

    @Override
    public void sendAgain(String email) {
        User user = users.findByEmail(email.trim())
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
        if (user.isEmailVerified()) {
            throw new ConflictException("Ton adresse email est déjà confirmée.");
        }
        if (sentRecently(user)) {
            throw new ConflictException("Un lien vient de t’être envoyé. Patiente une minute avant d’en demander un autre.");
        }
        send(user);
    }

    @Override
    public void resend(String email) {
        users.findByEmail(email.trim())
                .filter(user -> !user.isEmailVerified() && !sentRecently(user))
                .ifPresent(this::send);
    }

    private boolean sentRecently(User user) {
        return tokens.findLatest(user.getId())
                .map(last -> last.getCreatedAt().isAfter(Instant.now().minus(COOLDOWN)))
                .orElse(false);
    }
}
