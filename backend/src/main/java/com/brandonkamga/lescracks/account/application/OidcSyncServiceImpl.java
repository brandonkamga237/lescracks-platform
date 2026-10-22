package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;
import com.brandonkamga.lescracks.account.domain.model.IdentityClaims;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.account.domain.port.AuthMetrics;
import com.brandonkamga.lescracks.account.domain.port.ExternalIdentityStore;
import com.brandonkamga.lescracks.account.domain.port.IdentityTokenVerifier;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import java.util.Arrays;

public class OidcSyncServiceImpl implements OidcSyncService {
    private final AccountStore accounts;
    private final ExternalIdentityStore identities;
    private final IdentityTokenVerifier tokens;
    private final AuthMetrics metrics;

    public OidcSyncServiceImpl(AccountStore accounts, ExternalIdentityStore identities, IdentityTokenVerifier tokens,
                               AuthMetrics metrics) {
        this.accounts = accounts;
        this.identities = identities;
        this.tokens = tokens;
        this.metrics = metrics;
    }

    @Override
    public AccountSummary sync(String token, AuthProvider provider) {
        String channel = provider.name().toLowerCase();
        try {
            AccountSummary account = signIn(token, provider);
            metrics.login("member", channel, true);
            return account;
        } catch (RuntimeException failed) {
            metrics.login("member", channel, false);
            throw failed;
        }
    }

    private AccountSummary signIn(String token, AuthProvider provider) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Fournisseur d'identité LOCAL interdit pour la synchronisation OIDC.");
        }
        IdentityClaims claims = tokens.verify(token);
        if (claims.email() == null || claims.email().isBlank()) {
            throw new BadRequestException("Adresse email manquante dans le token.");
        }
        String email = claims.email().trim().toLowerCase();
        Account account = accounts.findByEmail(email).orElseGet(() -> accounts.save(Account.builder()
                .email(email)
                .firstName(firstNonBlank(claims.givenName(), claims.name(), claims.preferredUsername()))
                .lastName(firstNonBlank(claims.familyName()))
                .emailVerified(Boolean.TRUE.equals(claims.emailVerified()))
                .provider(provider)
                .build()));
        ensureIdentity(account, provider, claims.subject());
        return AccountSummary.of(account);
    }

    private void ensureIdentity(Account account, AuthProvider provider, String externalId) {
        if (externalId == null || externalId.isBlank()) return;
        identities.findByProviderAndExternalId(provider, externalId).ifPresent(existing -> {
            if (!existing.getAccountId().equals(account.getId())) {
                throw new ConflictException("Cette identité externe est déjà associée à un autre compte.");
            }
        });
        if (identities.findByAccountAndProvider(account.getId(), provider).isEmpty()) {
            identities.save(ExternalIdentity.builder().accountId(account.getId()).provider(provider).externalId(externalId).build());
        }
    }

    private static String firstNonBlank(String... values) {
        return Arrays.stream(values).filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }
}
