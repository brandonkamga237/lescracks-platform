package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;

import java.util.List;
import java.util.Optional;

public interface ExternalIdentityStore {

    Optional<ExternalIdentity> findByProviderAndExternalId(AuthProvider provider, String externalId);

    Optional<ExternalIdentity> findByAccountAndProvider(Long accountId, AuthProvider provider);

    List<ExternalIdentity> findByAccount(Long accountId);

    int countByAccount(Long accountId);

    ExternalIdentity save(ExternalIdentity identity);

    void delete(Long id);
}
