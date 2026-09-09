package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.UserIdentity;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ConflictException;
import com.brandonkamga.lescracks.repository.UserIdentityRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.OidcSyncService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

@Service
@Transactional
public class OidcSyncServiceImpl implements OidcSyncService {

    private final UserRepository users;
    private final UserIdentityRepository identities;

    public OidcSyncServiceImpl(UserRepository users, UserIdentityRepository identities) {
        this.users = users;
        this.identities = identities;
    }

    @Override
    public User sync(Jwt jwt, AuthProvider provider) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Fournisseur d'identité LOCAL interdit pour la synchronisation OIDC.");
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Adresse email manquante dans le token.");
        }
        String normalized = email.trim().toLowerCase();
        User user = users.findByEmailIgnoreCase(normalized)
                .orElseGet(() -> createFromToken(jwt, normalized, provider));
        ensureIdentity(user, provider, jwt.getSubject());
        return user;
    }

    private User createFromToken(Jwt jwt, String email, AuthProvider provider) {
        String firstName = firstNonBlank(
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("preferred_username"));
        String lastName = firstNonBlank(jwt.getClaimAsString("family_name"));
        Object verified = jwt.getClaim("email_verified");
        boolean emailVerified = verified instanceof Boolean b ? b : false;

        User user = User.builder()
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .emailVerified(emailVerified)
                .provider(provider)
                .build();
        return users.save(user);
    }

    private void ensureIdentity(User user, AuthProvider provider, String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return;
        }
        identities.findByProviderAndExternalId(provider, externalId).ifPresent(existing -> {
            if (!existing.getUser().getId().equals(user.getId())) {
                throw new ConflictException("Cette identité externe est déjà associée à un autre compte.");
            }
        });
        if (!identities.existsByUserAndProvider(user, provider)) {
            identities.save(UserIdentity.builder()
                    .user(user)
                    .provider(provider)
                    .externalId(externalId)
                    .build());
        }
    }

    private String firstNonBlank(String... values) {
        return Arrays.stream(values)
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse("");
    }
}
