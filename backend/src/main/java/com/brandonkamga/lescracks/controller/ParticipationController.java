package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ParticipationStatus;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.dto.participation.*;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.mapper.ParticipationMapper;
import com.brandonkamga.lescracks.service.interfaces.ParticipationService;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Who followed what, and the attestations that prove it.
 *
 * Nothing here happens on its own. An admin accepts, and later an admin confirms the person
 * went through with it — signing up is not finishing, and only a human knows the difference.
 */
@RestController
@RequestMapping("/api/participations")
@Tag(name = "Participations et attestations")
public class ParticipationController {

    private final ParticipationService participations;
    private final UserService users;
    private final ParticipationMapper mapper;

    public ParticipationController(ParticipationService participations, UserService users,
                                   ParticipationMapper mapper) {
        this.participations = participations;
        this.users = users;
        this.mapper = mapper;
    }

    @GetMapping("/me")
    @Operation(summary = "Ce que j'ai suivi")
    public List<ParticipationResponse> mine(@AuthenticationPrincipal Jwt token) {
        return participations.forUser(users.fromToken(token).getId()).stream()
                .map(mapper::toOwnResponse)
                .toList();
    }

    /** Public: this is the verification, and it is the point of issuing a code at all. */
    @GetMapping("/attestations/{code}")
    @Operation(summary = "Vérifier une attestation")
    public AttestationResponse verify(@PathVariable String code) {
        return participations.verify(code)
                .map(mapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Aucune attestation ne porte ce code."));
    }

    @GetMapping("/proof-of-work")
    @Operation(summary = "Combien de personnes ont été accompagnées, et sur quoi")
    public ProofOfWork proofOfWork() {
        return mapper.toProofOfWork(participations.proofOfWork());
    }

    // ── Back office ───────────────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ParticipationResponse> list(
            @RequestParam(required = false) ParticipationStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        var page = status == null
                ? participations.all(pageable)
                : participations.byStatus(status, pageable);
        return PageResponse.of(page, mapper::toResponse);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Enregistrer une participation sans candidature")
    public ParticipationResponse create(@Valid @RequestBody ParticipationRequest request) {
        return mapper.toResponse(participations.create(
                request.userId(), request.eventId(), request.cohort(), request.startedAt()));
    }

    @PostMapping("/admin/from-application/{applicationId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Inscrire quelqu'un dont la candidature est acceptée")
    public ParticipationResponse fromApplication(@PathVariable Long applicationId,
                                                 @Valid @RequestBody AcceptApplicationRequest request) {
        return mapper.toResponse(participations.fromApplication(
                applicationId, request.cohort(), request.startedAt()));
    }

    /**
     * Confirming completion, which is what issues the attestation. Doing it twice returns the
     * code already issued rather than minting a second — the first may be on a CV.
     */
    @PutMapping("/admin/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Valider l'achèvement et délivrer l'attestation")
    public AttestationResponse complete(@PathVariable Long id,
                                        @RequestBody(required = false) CompleteParticipationRequest request) {
        var completedOn = request == null ? null : request.completedOn();
        return mapper.toResponse(participations.complete(id, completedOn));
    }

    @PutMapping("/admin/{id}/abandon")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Marquer une participation comme abandonnée")
    public void abandon(@PathVariable Long id) {
        participations.abandon(id);
    }
}
