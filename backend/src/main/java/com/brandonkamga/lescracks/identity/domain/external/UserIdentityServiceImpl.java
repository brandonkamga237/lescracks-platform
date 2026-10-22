package com.brandonkamga.lescracks.identity.domain.external;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.time.Instant;
import java.util.List;

public class UserIdentityServiceImpl implements UserIdentityService {
    private final UserStore users;
    private final UserIdentityStore identities;
    private final IdentityTokenVerifier tokens;

    public UserIdentityServiceImpl(UserStore users, UserIdentityStore identities, IdentityTokenVerifier tokens) {
        this.users = users;
        this.identities = identities;
        this.tokens = tokens;
    }

    @Override
    public List<UserIdentity> list(String email) {
        return identities.findByUser(requireUser(email).getId());
    }

    @Override
    public UserIdentity link(String email, AuthProvider provider, String token) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Impossible de lier une connexion locale par ce flux.");
        }
        IdentityClaims claims = tokens.verify(token);
        if (!normalize(claims.email()).equals(normalize(email))) {
            throw new BadRequestException("L'adresse email du fournisseur ne correspond pas à celle du compte.");
        }
        User user = requireUser(email);
        String externalId = claims.subject();
        if (externalId == null || externalId.isBlank()) {
            throw new BadRequestException("Identité externe invalide.");
        }
        identities.findByProviderAndExternalId(provider, externalId).ifPresent(existing -> {
            if (!existing.getUserId().equals(user.getId())) {
                throw new ConflictException("Cette identité externe est déjà liée à un autre compte.");
            }
        });
        UserIdentity identity = identities.findByUserAndProvider(user.getId(), provider)
                .orElseGet(() -> UserIdentity.builder().userId(user.getId()).provider(provider).build());
        identity.setExternalId(externalId);
        identity.setUpdatedAt(Instant.now());
        return identities.save(identity);
    }

    @Override
    public void unlink(String email, AuthProvider provider) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Impossible de retirer une connexion locale par ce flux.");
        }
        User user = requireUser(email);
        UserIdentity identity = identities.findByUserAndProvider(user.getId(), provider)
                .orElseThrow(() -> new NotFoundException("Identité", "provider", provider));
        if (!canRemoveLoginMethod(user)) {
            throw new ForbiddenException("Tu dois conserver au moins une méthode de connexion.");
        }
        identities.delete(identity);
    }

    private boolean canRemoveLoginMethod(User user) {
        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
        return hasPassword || identities.countByUser(user.getId()) > 1;
    }

    private User requireUser(String email) {
        return users.findByEmail(normalize(email))
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
