package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /** The token's `sub` claim is the only stable link between a request and a row. */
    Optional<User> findBySubject(String subject);

    Optional<User> findByEmailIgnoreCase(String email);
}
