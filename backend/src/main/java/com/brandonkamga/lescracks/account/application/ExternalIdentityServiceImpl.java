package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;
import com.brandonkamga.lescracks.account.domain.model.IdentityClaims;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.ExternalIdentityStore;
import com.brandonkamga.lescracks.account.domain.port.IdentityTokenVerifier;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.time.Instant;
import java.util.List;

public class ExternalIdentityServiceImpl implements ExternalIdentityService {
    private final AccountStore accounts;
    private final ExternalIdentityStore identities;
    private final IdentityTokenVerifier tokens;

    public ExternalIdentityServiceImpl(AccountStore accounts, ExternalIdentityStore identities, IdentityTokenVerifier tokens) {
        this.accounts = accounts;
        this.identities = identities;
        this.tokens = tokens;
    }

    @Override
    public List<ExternalIdentity> list(String email) {
        return identities.findByAccount(requireAccount(email).getId());
    }

    @Override
    public ExternalIdentity link(String email, AuthProvider provider, String token) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Impossible de lier une connexion locale par ce flux.");
        }
        IdentityClaims claims = tokens.verify(token);
        if (!normalize(claims.email()).equals(normalize(email))) {
            throw new BadRequestException("L'adresse email du fournisseur ne correspond pas à celle du compte.");
        }
        Account account = requireAccount(email);
        String externalId = claims.subject();
        if (externalId == null || externalId.isBlank()) {
            throw new BadRequestException("Identité externe invalide.");
        }
        identities.findByProviderAndExternalId(provider, externalId).ifPresent(existing -> {
            if (!existing.getAccountId().equals(account.getId())) {
                throw new ConflictException("Cette identité externe est déjà liée à un autre compte.");
            }
        });
        ExternalIdentity identity = identities.findByAccountAndProvider(account.getId(), provider)
                .orElseGet(() -> ExternalIdentity.builder().accountId(account.getId()).provider(provider).build());
        identity.setExternalId(externalId);
        identity.setUpdatedAt(Instant.now());
        return identities.save(identity);
    }

    @Override
    public void unlink(String email, AuthProvider provider) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Impossible de retirer une connexion locale par ce flux.");
        }
        Account account = requireAccount(email);
        ExternalIdentity identity = identities.findByAccountAndProvider(account.getId(), provider)
                .orElseThrow(() -> new NotFoundException("Identité", "provider", provider));
        boolean hasPassword = account.getPasswordHash() != null && !account.getPasswordHash().isBlank();
        if (!hasPassword && identities.countByAccount(account.getId()) <= 1) {
            throw new ForbiddenException("Tu dois conserver au moins une méthode de connexion.");
        }
        identities.delete(identity.getId());
    }

    private Account requireAccount(String email) {
        return accounts.findByEmail(normalize(email))
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
