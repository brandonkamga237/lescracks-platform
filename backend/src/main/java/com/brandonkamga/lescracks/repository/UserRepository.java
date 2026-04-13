package com.brandonkamga.lescracks.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.ProviderType;


@Repository
public interface UserRepository extends JpaRepository<User, Long>{

    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByVerificationToken(String token);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(@Param("email") String email);
    
    // Dashboard analytics methods
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName")
    long countByRole_Name(@Param("roleName") RoleName roleName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.provider.providerName = :providerName")
    long countByProvider_Name(@Param("providerName") ProviderType providerName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt > :dateTime")
    long countByCreatedAtAfter(@Param("dateTime") LocalDateTime dateTime);

    @Query("SELECT u FROM User u WHERE u.role.name = 'premium_user' AND u.premiumExpiresAt IS NOT NULL AND u.premiumExpiresAt <= :now")
    List<User> findExpiredPremiumUsers(@Param("now") LocalDateTime now);

    @Query("SELECT u FROM User u WHERE u.role.name = 'premium_user' AND u.premiumExpiresAt >= :from AND u.premiumExpiresAt < :to")
    List<User> findPremiumUsersExpiringBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

}
