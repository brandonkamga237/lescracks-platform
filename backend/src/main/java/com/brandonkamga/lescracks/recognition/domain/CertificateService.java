package com.brandonkamga.lescracks.recognition.domain;

import java.util.Collection;
import java.util.List;

/** Attestations: prepared from an event, issued by the admin, verified by anyone. */
public interface CertificateService {

    /**
     * Drafts an attestation for everyone the event recognises, skipping those who already have one:
     * project members (winner and podium included) for an event that takes projects, people marked
     * present otherwise. Returns the event's attestations.
     */
    List<CertificateView> prepare(Long eventId);

    List<CertificateView> forEvent(Long eventId);

    /** Issues the drafts among these ids and emails each holder; anything else is left as it is. */
    List<Certificate> issue(Collection<Long> ids);

    Certificate revoke(Long id);

    /** Removes a draft that should not exist; an issued attestation is revoked instead. */
    void discard(Long id);

    /** Issued and revoked attestations are public by their code; a draft is not. */
    Certificate verify(String code);

    List<Certificate> mine(String email);
}
