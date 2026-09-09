package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.UserIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserIdentityRepository extends JpaRepository<UserIdentity, Long> {

    Optional<UserIdentity> findByProviderAndExternalId(AuthProvider provider, String externalId);

    Optional<UserIdentity> findByUserAndProvider(User user, AuthProvider provider);

    List<UserIdentity> findByUser(User user);

    boolean existsByUserAndProvider(User user, AuthProvider provider);

    int countByUser(User user);

    void deleteByUserAndProvider(User user, AuthProvider provider);
}
