package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserRegistrationServiceImpl implements UserRegistrationService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final EmailVerificationService verification;
    private final AuthMetrics metrics;

    public UserRegistrationServiceImpl(UserRepository users, PasswordEncoder passwords,
                                       EmailVerificationService verification, AuthMetrics metrics) {
        this.users = users;
        this.passwords = passwords;
        this.verification = verification;
        this.metrics = metrics;
    }

    @Override
    public User register(Registration registration) {
        // Checked before anything is saved: a mistyped number must not leave a half-created account.
        if (registration.phone() != null && !registration.phone().isBlank()) PhoneNumbers.parse(registration.phone());
        String email = registration.email().trim().toLowerCase();
        User existing = users.findByEmailIgnoreCase(email).orElse(null);
        if (existing != null && existing.hasLoginMethod()) {
            metrics.register(false);
            throw new BadRequestException("Cette adresse email est déjà utilisée.");
        }
        User user = existing != null ? existing : User.builder()
                .email(email)
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .build();
        user.setPasswordHash(passwords.encode(registration.password()));
        user.setFirstName(registration.firstName().trim());
        user.setLastName(registration.lastName().trim());
        user.setEmailVerified(false);
        user = users.save(user);
        MemberProfiles.phone(user, registration.phone());
        if (registration.marketingConsent() != null) user.setMarketingConsent(registration.marketingConsent());
        MemberProfiles.arrival(user, registration.arrival());
        verification.send(user);
        metrics.register(true);
        return user;
    }
}
