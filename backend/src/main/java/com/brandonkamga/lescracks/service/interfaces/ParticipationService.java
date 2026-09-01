package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Attestation;
import com.brandonkamga.lescracks.domain.Participation;
import com.brandonkamga.lescracks.domain.ParticipationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Who followed what, and the attestation that proves it.
 *
 * Nothing here happens automatically. An admin accepts an application, and later an admin
 * says the person went through with it — signing up is not finishing, and only a human knows
 * the difference.
 */
public interface ParticipationService {

    /** Turns an accepted application into a participation under way. */
    Participation fromApplication(Long applicationId, String cohort, LocalDate startedAt);

    /** Records one an admin entered directly, with no application behind it. */
    Participation create(Long userId, Long eventId, String cohort, LocalDate startedAt);

    /**
     * Confirms completion and issues the attestation. Completing again returns the one
     * already issued rather than minting a second: the first may be printed on a CV.
     */
    Attestation complete(Long participationId, LocalDate completedOn);

    void abandon(Long participationId);

    List<Participation> forUser(Long userId);

    Page<Participation> byStatus(ParticipationStatus status, Pageable pageable);

    Page<Participation> all(Pageable pageable);

    Participation require(Long id);

    /** The public check: someone holding a code asks whether it is real. */
    Optional<Attestation> verify(String code);

    /** How many people were helped, and on what. The count nobody can dispute. */
    Map<String, Object> proofOfWork();
}
