package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.dto.application.ApplicationRequest;
import com.brandonkamga.lescracks.dto.application.ApplicationResponse;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.mapper.ApplicationMapper;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
@Tag(name = "Candidatures")
public class ApplicationController {

    private final ApplicationService applications;
    private final ApplicationMapper mapper;

    public ApplicationController(ApplicationService applications, ApplicationMapper mapper) {
        this.applications = applications;
        this.mapper = mapper;
    }

    /** Open on purpose: people apply first and create an account afterwards. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Postuler à l'Accompagnement 360 ou s'inscrire à un événement")
    public ApplicationResponse apply(@Valid @RequestBody ApplicationRequest request) {
        return mapper.toResponse(applications.apply(new ApplicationService.ApplicationDraft(
                request.target(), request.eventId(), request.fullName(),
                request.email(), request.phone(), request.motivation())));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Les candidatures, par statut ou par type")
    public PageResponse<ApplicationResponse> list(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) EnrolmentTarget target,
            @PageableDefault(size = 20) Pageable pageable) {
        var page = status != null
                ? applications.byStatus(status, pageable)
                : applications.byTarget(target != null ? target : EnrolmentTarget.MENTORSHIP, pageable);
        return PageResponse.of(page, mapper::toResponse);
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApplicationResponse one(@PathVariable Long id) {
        return mapper.toResponse(applications.require(id));
    }

    /**
     * Deciding is separate from what follows: accepting records the decision, and turning it
     * into a participation is a second, deliberate step in the participations controller.
     */
    @PutMapping("/admin/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Accepter ou refuser une candidature")
    public ApplicationResponse decide(@PathVariable Long id, @RequestParam ApplicationStatus outcome) {
        return mapper.toResponse(applications.decide(id, outcome));
    }
}
