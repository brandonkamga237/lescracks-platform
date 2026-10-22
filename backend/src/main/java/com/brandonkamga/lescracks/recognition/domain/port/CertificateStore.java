package com.brandonkamga.lescracks.recognition.domain.port;

import com.brandonkamga.lescracks.recognition.domain.model.Certificate;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CertificateStore {

    Optional<Certificate> findById(Long id);

    Optional<Certificate> findByCode(String code);

    List<Certificate> findAllById(Collection<Long> ids);

    /** By kind, then holder name. */
    List<Certificate> findByEvent(Long eventId);

    /** Issued ones, latest first. */
    List<Certificate> findIssuedTo(Long userId);

    /** In one statement; a draft whose holder already has that kind for the event is skipped. Returns how many were added. */
    int addDrafts(List<Certificate> drafts);

    /** Writes status, holder name and issue date of many attestations in one statement. */
    void saveAll(Collection<Certificate> certificates);

    void delete(Long id);
}
