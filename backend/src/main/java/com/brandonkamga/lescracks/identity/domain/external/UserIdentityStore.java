package com.brandonkamga.lescracks.identity.domain.external;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;

import java.util.List;
import java.util.Optional;

public interface UserIdentityStore {

    Optional<UserIdentity> findByProviderAndExternalId(AuthProvider provider, String externalId);

    Optional<UserIdentity> findByUserAndProvider(Long userId, AuthProvider provider);

    List<UserIdentity> findByUser(Long userId);

    int countByUser(Long userId);

    UserIdentity save(UserIdentity identity);

    void delete(UserIdentity identity);
}
