package com.brandonkamga.lescracks.identity.domain.signup;

import com.brandonkamga.lescracks.identity.domain.credential.AuthMetrics;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordHasher;
import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.MemberProfiles;
import com.brandonkamga.lescracks.identity.domain.member.PhoneNumbers;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

public class UserRegistrationServiceImpl implements UserRegistrationService {
    private final UserStore users;
    private final PasswordHasher passwords;
    private final EmailVerificationService verification;
    private final AuthMetrics metrics;
    private final MemberEvents events;

    public UserRegistrationServiceImpl(UserStore users, PasswordHasher passwords,
                                       EmailVerificationService verification, AuthMetrics metrics,
                                       MemberEvents events) {
        this.users = users;
        this.passwords = passwords;
        this.verification = verification;
        this.metrics = metrics;
        this.events = events;
    }

    @Override
    public User register(Registration registration) {
        // Checked before anything is saved: a mistyped number must not leave a half-created account.
        if (registration.phone() != null && !registration.phone().isBlank()) PhoneNumbers.parse(registration.phone());
        String email = registration.email().trim().toLowerCase();
        User existing = users.findByEmail(email).orElse(null);
        if (existing != null && existing.hasLoginMethod()) {
            metrics.register(false);
            throw new BadRequestException("Cette adresse email est déjà utilisée.");
        }
        User user = existing != null ? existing : User.builder()
                .email(email)
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .build();
        user.setPasswordHash(passwords.hash(registration.password()));
        user.setFirstName(registration.firstName().trim());
        user.setLastName(registration.lastName().trim());
        user.setEmailVerified(false);
        MemberProfiles.phone(user, registration.phone());
        if (registration.marketingConsent() != null) user.setMarketingConsent(registration.marketingConsent());
        MemberProfiles.arrival(user, registration.arrival());
        user = users.save(user);
        verification.send(user);
        events.registered(new MemberRegistered(user.getEmail(), Boolean.TRUE.equals(registration.newsletter())));
        metrics.register(true);
        return user;
    }
}
