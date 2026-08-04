package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ApplicationType;
import com.brandonkamga.lescracks.domain.ApplicationTypeName;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ProgrammeStatusResponse;
import com.brandonkamga.lescracks.dto.ProgrammeStatusUpdateRequest;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.ApplicationTypeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Availability of the Accompagnement 360. Read publicly so the marketing pages can show
 * an open/closed state; toggled by an admin. Modelled on the existing ApplicationType
 * rather than a new settings table — the 360 is already a first-class application type.
 */
@RestController
@RequestMapping("/api/programme")
@Tag(name = "Programme", description = "Disponibilité de l'Accompagnement 360")
public class ProgrammeController {

    private final ApplicationTypeRepository applicationTypeRepository;

    public ProgrammeController(ApplicationTypeRepository applicationTypeRepository) {
        this.applicationTypeRepository = applicationTypeRepository;
    }

    @GetMapping("/status")
    @Operation(summary = "Disponibilité de l'Accompagnement 360 (public)")
    public ResponseEntity<ApiResponse<ProgrammeStatusResponse>> status() {
        ApplicationType type = require360();
        return ResponseEntity.ok(ApiResponse.success(
                new ProgrammeStatusResponse(type.isOpen(), type.getClosedMessage())));
    }

    @PatchMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Ouvrir ou fermer l'Accompagnement 360 — admin uniquement")
    public ResponseEntity<ApiResponse<ProgrammeStatusResponse>> update(
            @RequestBody ProgrammeStatusUpdateRequest request) {
        ApplicationType type = require360();
        if (request.open() != null) {
            type.setOpen(request.open());
        }
        type.setClosedMessage(request.message());
        applicationTypeRepository.save(type);
        return ResponseEntity.ok(ApiResponse.success(
                new ProgrammeStatusResponse(type.isOpen(), type.getClosedMessage()),
                "Statut de l'Accompagnement 360 mis à jour"));
    }

    private ApplicationType require360() {
        return applicationTypeRepository.findByName(ApplicationTypeName.accompagnement_360)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ApplicationType", "name", ApplicationTypeName.accompagnement_360.name()));
    }
}
