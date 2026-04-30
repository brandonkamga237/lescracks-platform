package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.ApplicationType;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ApplicationRequest;
import com.brandonkamga.lescracks.dto.ApplicationResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.ApplicationTypeRepository;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.impl.MailServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Candidatures", description = "API de gestion des candidatures")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ApplicationTypeRepository applicationTypeRepository;
    private final MailServiceImpl mailService;

    public ApplicationController(
            ApplicationService applicationService,
            UserRepository userRepository,
            EventRepository eventRepository,
            ApplicationTypeRepository applicationTypeRepository,
            MailServiceImpl mailService) {
        this.applicationService = applicationService;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.applicationTypeRepository = applicationTypeRepository;
        this.mailService = mailService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Liste toutes les candidatures — admin uniquement")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getAllApplications() {
        List<ApplicationResponse> applications = applicationService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Récupérer une candidature par ID — admin uniquement")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplicationById(
            @Parameter(description = "ID de la candidature") @PathVariable Long id) {
        return applicationService.findByIdOptional(id)
                .map(app -> ResponseEntity.ok(ApiResponse.success(toResponse(app))))
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Récupérer les candidatures d'un utilisateur — admin uniquement")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplicationsByUser(
            @PathVariable Long userId) {
        List<ApplicationResponse> applications = applicationService.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Récupérer les candidatures d'un événement — admin uniquement")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplicationsByEvent(
            @PathVariable Long eventId) {
        List<ApplicationResponse> applications = applicationService.findByEventId(eventId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    // POST public — aucun token requis (candidature publique Accompagnement 360)
    @PostMapping
    @Operation(summary = "Soumettre une candidature publique")
    public ResponseEntity<ApiResponse<ApplicationResponse>> createApplication(
            @Valid @RequestBody ApplicationRequest request) {
        Application application = toEntity(request);
        Application saved = applicationService.save(application);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Candidature soumise avec succès"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Changer le statut d'une candidature — admin uniquement")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplicationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Application application = applicationService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        ApplicationStatus newStatus = ApplicationStatus.valueOf(body.get("status").toLowerCase());
        application.setStatus(newStatus);
        Application saved = applicationService.save(application);

        // Email automatique quand accepté
        if (newStatus == ApplicationStatus.accepted && saved.getEmailAddress() != null) {
            mailService.sendApplicationAccepted(
                    saved.getEmailAddress(),
                    saved.getFullName() != null ? saved.getFullName() : "Candidat",
                    saved.getWhatsappNumber()
            );
        }

        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Statut mis à jour"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Supprimer une candidature — admin uniquement")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable Long id) {
        Application application = applicationService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        if (application.getStatus() == ApplicationStatus.accepted) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Une candidature acceptée ne peut pas être supprimée"));
        }

        applicationService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Candidature supprimée"));
    }

    private Application toEntity(ApplicationRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        }

        Event event = null;
        if (request.getEventId() != null) {
            event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event", "id", request.getEventId()));
        }

        ApplicationType applicationType = applicationTypeRepository.findById(request.getApplicationTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("ApplicationType", "id", request.getApplicationTypeId()));

        return Application.builder()
                .user(user)
                .event(event)
                .applicationType(applicationType)
                .status(ApplicationStatus.pending)
                .fullName(request.getFullName())
                .emailAddress(request.getEmailAddress())
                .whatsappNumber(request.getWhatsappNumber())
                .age(request.getAge())
                .motivationText(request.getMotivationText())
                .technicalLevel(request.getTechnicalLevel())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ApplicationResponse toResponse(Application app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .userId(app.getUser() != null ? app.getUser().getId() : null)
                .username(app.getUser() != null ? app.getUser().getUsername() : null)
                .eventId(app.getEvent() != null ? app.getEvent().getId() : null)
                .eventTitle(app.getEvent() != null ? app.getEvent().getTitle() : null)
                .applicationTypeId(app.getApplicationType().getId())
                .applicationTypeName(app.getApplicationType().getName().name())
                .status(app.getStatus())
                .fullName(app.getFullName())
                .emailAddress(app.getEmailAddress())
                .whatsappNumber(app.getWhatsappNumber())
                .age(app.getAge())
                .motivationText(app.getMotivationText())
                .technicalLevel(app.getTechnicalLevel())
                .createdAt(app.getCreatedAt())
                .build();
    }
}
