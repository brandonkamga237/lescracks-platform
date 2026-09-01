package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Attestation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttestationRepository extends JpaRepository<Attestation, Long> {

    /** The public check: someone holding a code asks whether it is real. */
    Optional<Attestation> findByCode(String code);

    boolean existsByCode(String code);
}
