package com.brandonkamga.lescracks.recognition.infra;

import com.brandonkamga.lescracks.recognition.domain.Certificate;
import com.brandonkamga.lescracks.recognition.domain.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.CertificateStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    Optional<Certificate> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByUserIdAndEventIdAndKind(Long userId, Long eventId, CertificateKind kind);

    List<Certificate> findByEventIdOrderByKindAscHolderNameAsc(Long eventId);

    List<Certificate> findByUserIdAndStatusOrderByIssuedAtDesc(Long userId, CertificateStatus status);
}
