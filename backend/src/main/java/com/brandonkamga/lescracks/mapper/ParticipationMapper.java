package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Attestation;
import com.brandonkamga.lescracks.domain.Participation;
import com.brandonkamga.lescracks.dto.participation.AttestationResponse;
import com.brandonkamga.lescracks.dto.participation.ParticipationResponse;
import com.brandonkamga.lescracks.dto.participation.ProofOfWork;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ParticipationMapper {

    /** For the back office, where knowing whose participation this is matters. */
    public ParticipationResponse toResponse(Participation participation) {
        return build(participation, true);
    }

    /** For someone reading their own: their name back at them is noise. */
    public ParticipationResponse toOwnResponse(Participation participation) {
        return build(participation, false);
    }

    private ParticipationResponse build(Participation participation, boolean withHolder) {
        return new ParticipationResponse(
                participation.getId(),
                participation.getTarget(),
                participation.getEvent() == null ? null : participation.getEvent().getId(),
                participation.label(),
                participation.getStatus(),
                participation.getCohort(),
                participation.getStartedAt(),
                participation.getCompletedAt(),
                withHolder ? participation.getUser().getId() : null,
                withHolder ? participation.getUser().getDisplayName() : null,
                participation.attestation().map(Attestation::getCode).orElse(null));
    }

    /**
     * What a public check answers with: the name, what was followed, when. No email and no
     * identifier — whoever holds a code can read this, so it must be safe for them to.
     */
    public AttestationResponse toResponse(Attestation attestation) {
        Participation participation = attestation.getParticipation();
        return new AttestationResponse(
                attestation.getCode(),
                participation.getUser().getDisplayName(),
                participation.label(),
                participation.getCompletedAt(),
                attestation.getIssuedAt());
    }

    @SuppressWarnings("unchecked")
    public ProofOfWork toProofOfWork(Map<String, Object> stats) {
        return new ProofOfWork(
                (long) stats.get("peopleHelped"),
                (long) stats.get("completed"),
                (long) stats.get("inProgress"),
                (Map<String, Long>) stats.get("byProgramme"));
    }
}
