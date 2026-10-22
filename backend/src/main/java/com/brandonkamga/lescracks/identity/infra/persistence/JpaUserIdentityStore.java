package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.external.UserIdentity;
import com.brandonkamga.lescracks.identity.domain.external.UserIdentityStore;
import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
class JpaUserIdentityStore implements UserIdentityStore {

    private final UserIdentityJpaRepository identities;

    JpaUserIdentityStore(UserIdentityJpaRepository identities) {
        this.identities = identities;
    }

    @Override
    public Optional<UserIdentity> findByProviderAndExternalId(AuthProvider provider, String externalId) {
        return identities.findByProviderAndExternalId(provider, externalId).map(JpaUserIdentityStore::toDomain);
    }

    @Override
    public Optional<UserIdentity> findByUserAndProvider(Long userId, AuthProvider provider) {
        return identities.findByUserIdAndProvider(userId, provider).map(JpaUserIdentityStore::toDomain);
    }

    @Override
    public List<UserIdentity> findByUser(Long userId) {
        return identities.findByUserId(userId).stream().map(JpaUserIdentityStore::toDomain).toList();
    }

    @Override
    public int countByUser(Long userId) {
        return identities.countByUserId(userId);
    }

    @Override
    public UserIdentity save(UserIdentity identity) {
        UserIdentityEntity entity = identity.getId() == null ? new UserIdentityEntity()
                : identities.findById(identity.getId()).orElseThrow(() -> new IllegalStateException("No identity " + identity.getId() + " to update"));
        entity.setUserId(identity.getUserId());
        entity.setProvider(identity.getProvider());
        entity.setExternalId(identity.getExternalId());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(identity.getCreatedAt());
        entity.setUpdatedAt(identity.getUpdatedAt());
        return toDomain(identities.save(entity));
    }

    @Override
    public void delete(UserIdentity identity) {
        identities.deleteById(identity.getId());
    }

    private static UserIdentity toDomain(UserIdentityEntity entity) {
        return UserIdentity.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .provider(entity.getProvider())
                .externalId(entity.getExternalId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
