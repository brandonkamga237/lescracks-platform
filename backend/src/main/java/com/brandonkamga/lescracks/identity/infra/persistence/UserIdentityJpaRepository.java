package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface UserIdentityJpaRepository extends JpaRepository<UserIdentityEntity, Long> {

    Optional<UserIdentityEntity> findByProviderAndExternalId(AuthProvider provider, String externalId);

    Optional<UserIdentityEntity> findByUserIdAndProvider(Long userId, AuthProvider provider);

    List<UserIdentityEntity> findByUserId(Long userId);

    int countByUserId(Long userId);
}
