package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Attestation;
import com.brandonkamga.lescracks.domain.Participation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Everything that happens to a person's link with a programme.
 *
 * The controller calls this and nothing else, so the rules about when an attestation may be
 * issued live in one place instead of being restated at each entry point.
 */
public interface ParticipationService {

    /**
     * Turns an accepted application into a participation under way.
     *
     * @throws com.brandonkamga.lescracks.exception.BadRequestException
     *         if the application was already accepted, or the person already follows that event
     */
    Participation acceptApplication(Long applicationId, String cohort, LocalDate startedAt);

    /** Records a participation an admin entered directly, outside any application. */
    Participation create(Long userId, Long eventId, String cohort, LocalDate startedAt);

    /**
     * Confirms the person went through with it and issues the attestation that proves it.
     * Completing twice returns the attestation already issued rather than minting a second.
     */
    Attestation complete(Long participationId, LocalDate completedOn);

    void abandon(Long participationId);

    List<Participation> findByUser(Long userId);

    Page<Participation> findAll(Pageable pageable);

    Optional<Participation> findById(Long id);

    /** Looks an attestation up by the code printed on it. Public: this is the verification. */
    Optional<Attestation> verify(String code);

    /** How many distinct people completed something, and the split by programme. */
    Map<String, Object> proofOfWork();
}
