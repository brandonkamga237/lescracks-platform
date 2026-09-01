package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Attestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttestationRepository extends JpaRepository<Attestation, Long> {

    Optional<Attestation> findByCode(String code);

    boolean existsByCode(String code);
}
