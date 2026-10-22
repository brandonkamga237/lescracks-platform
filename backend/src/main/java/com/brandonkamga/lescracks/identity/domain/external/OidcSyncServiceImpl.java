package com.brandonkamga.lescracks.identity.domain.external;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import java.util.Arrays;

public class OidcSyncServiceImpl implements OidcSyncService {
    private final UserStore users;
    private final UserIdentityStore identities;
    private final IdentityTokenVerifier tokens;

    public OidcSyncServiceImpl(UserStore users, UserIdentityStore identities, IdentityTokenVerifier tokens) {
        this.users = users;
        this.identities = identities;
        this.tokens = tokens;
    }

    @Override
    public User sync(String token, AuthProvider provider) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Fournisseur d'identité LOCAL interdit pour la synchronisation OIDC.");
        }
        IdentityClaims claims = tokens.verify(token);
        if (claims.email() == null || claims.email().isBlank()) {
            throw new BadRequestException("Adresse email manquante dans le token.");
        }
        String normalized = claims.email().trim().toLowerCase();
        User user = users.findByEmail(normalized)
                .orElseGet(() -> createFromClaims(claims, normalized, provider));
        ensureIdentity(user, provider, claims.subject());
        return user;
    }

    private User createFromClaims(IdentityClaims claims, String email, AuthProvider provider) {
        return users.save(User.builder()
                .email(email)
                .firstName(firstNonBlank(claims.givenName(), claims.name(), claims.preferredUsername()))
                .lastName(firstNonBlank(claims.familyName()))
                .emailVerified(Boolean.TRUE.equals(claims.emailVerified()))
                .provider(provider)
                .build());
    }

    private void ensureIdentity(User user, AuthProvider provider, String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return;
        }
        identities.findByProviderAndExternalId(provider, externalId).ifPresent(existing -> {
            if (!existing.getUserId().equals(user.getId())) {
                throw new ConflictException("Cette identité externe est déjà associée à un autre compte.");
            }
        });
        if (identities.findByUserAndProvider(user.getId(), provider).isEmpty()) {
            identities.save(UserIdentity.builder()
                    .userId(user.getId())
                    .provider(provider)
                    .externalId(externalId)
                    .build());
        }
    }

    private static String firstNonBlank(String... values) {
        return Arrays.stream(values)
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse("");
    }
}
