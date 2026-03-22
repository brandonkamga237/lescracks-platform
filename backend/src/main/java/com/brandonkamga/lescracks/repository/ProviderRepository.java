package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Provider entity.
 */
@Repository
public interface ProviderRepository extends JpaRepository<Provider, Long> {

    Optional<Provider> findByProviderName(ProviderType providerName);

    boolean existsByProviderName(ProviderType providerName);
}
