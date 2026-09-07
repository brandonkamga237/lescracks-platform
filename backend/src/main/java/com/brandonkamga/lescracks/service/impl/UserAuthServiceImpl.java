package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.EmailVerificationToken;
import com.brandonkamga.lescracks.domain.PasswordResetToken;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.UserStatus;
import com.brandonkamga.lescracks.dto.auth.*;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.repository.EmailVerificationTokenRepository;
import com.brandonkamga.lescracks.repository.PasswordResetTokenRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.MailService;
import com.brandonkamga.lescracks.service.interfaces.UserAuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;

@Service
@Transactional
public class UserAuthServiceImpl implements UserAuthService {
    private final UserRepository users;
    private final PasswordResetTokenRepository passwordTokens;
    private final EmailVerificationTokenRepository emailTokens;
    private final PasswordEncoder passwords;
    private final MailService mail;
    private final SecureRandom random = new SecureRandom();

    public UserAuthServiceImpl(UserRepository users, PasswordResetTokenRepository passwordTokens,
                               EmailVerificationTokenRepository emailTokens,
                               PasswordEncoder passwords, MailService mail) {
        this.users = users;
        this.passwordTokens = passwordTokens;
        this.emailTokens = emailTokens;
        this.passwords = passwords;
        this.mail = mail;
    }

    @Override
    public User register(UserRegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Cette adresse email est déjà utilisée.");
        }
        User user = users.save(User.builder()
                .email(email)
                .passwordHash(passwords.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .build());
        sendVerificationEmail(user);
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public User authenticate(UserLoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email().trim())
                .filter(candidate -> candidate.getPasswordHash() != null
                        && passwords.matches(request.password(), candidate.getPasswordHash())
                        && candidate.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Email ou mot de passe incorrect."));
        if (!user.isEmailVerified()) {
            throw new BadRequestException("Ton adresse email n’a pas encore été vérifiée. Consulte ta boîte de réception ou demande un nouveau lien.");
        }
        return user;
    }

    @Override
    public void verifyEmail(String token) {
        EmailVerificationToken verification = emailTokens.findByTokenHash(hash(token))
                .filter(EmailVerificationToken::isValid)
                .orElseThrow(() -> new BadRequestException("Le lien de vérification est invalide ou expiré."));
        User user = verification.getUser();
        user.setEmailVerified(true);
        verification.markUsed();
    }

    @Override
    public void resendVerificationEmail(String email) {
        users.findByEmailIgnoreCase(email.trim()).ifPresent(this::sendVerificationEmail);
    }

    @Override
    public void requestPasswordReset(ForgotPasswordRequest request) {
        users.findByEmailIgnoreCase(request.email().trim()).ifPresent(user -> {
            if (user.getPasswordHash() == null) return;
            String raw = randomToken();
            passwordTokens.save(PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hash(raw))
                    .expiresAt(Instant.now().plus(30, ChronoUnit.MINUTES))
                    .build());
            mail.sendPasswordReset(user.getEmail(), raw);
        });
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordTokens.findByTokenHash(hash(request.token()))
                .filter(candidate -> candidate.getUsedAt() == null
                        && candidate.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new BadRequestException("Le lien de réinitialisation est invalide ou expiré."));
        token.getUser().setPasswordHash(passwords.encode(request.password()));
        token.markUsed();
    }

    private void sendVerificationEmail(User user) {
        String raw = randomToken();
        emailTokens.save(EmailVerificationToken.builder()
                .user(user)
                .tokenHash(hash(raw))
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build());
        mail.sendVerificationEmail(user.getEmail(), raw, user.getFirstName());
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de générer le token.", exception);
        }
    }
}
