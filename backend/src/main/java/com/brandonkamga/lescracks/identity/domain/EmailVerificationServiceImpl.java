package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.EmailVerificationTokenRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.VerificationEmail;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@Transactional
public class EmailVerificationServiceImpl implements EmailVerificationService {
    private static final Duration VALIDITY = Duration.ofHours(24);
    private static final Duration COOLDOWN = Duration.ofMinutes(1);

    private final UserRepository users;
    private final EmailVerificationTokenRepository tokens;
    private final OneTimeTokens oneTimeTokens;
    private final Mailer mail;

    public EmailVerificationServiceImpl(UserRepository users, EmailVerificationTokenRepository tokens,
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
                .user(user)
                .tokenHash(token.hash())
                .expiresAt(Instant.now().plus(VALIDITY))
                .build());
        mail.send(new VerificationEmail(user.getEmail(), user.getFirstName(), token.raw()));
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
    public void sendAgain(String email) {
        User user = users.findByEmailIgnoreCase(email.trim())
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
        users.findByEmailIgnoreCase(email.trim())
                .filter(user -> !user.isEmailVerified() && !sentRecently(user))
                .ifPresent(this::send);
    }

    private boolean sentRecently(User user) {
        return tokens.findFirstByUserOrderByCreatedAtDesc(user)
                .map(last -> last.getCreatedAt().isAfter(Instant.now().minus(COOLDOWN)))
                .orElse(false);
    }
}
