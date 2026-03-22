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
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Candidatures", description = "API de gestion des candidatures aux événements")
@SecurityRequirement(name = "bearerAuth")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ApplicationTypeRepository applicationTypeRepository;

    public ApplicationController(
            ApplicationService applicationService,
            UserRepository userRepository,
            EventRepository eventRepository,
            ApplicationTypeRepository applicationTypeRepository) {
        this.applicationService = applicationService;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.applicationTypeRepository = applicationTypeRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Liste toutes les candidatures", 
               description = "Retourne la liste de toutes les candidatures. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Liste des candidatures"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs")
    })
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getAllApplications() {
        List<ApplicationResponse> applications = applicationService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une candidature par ID", 
               description = "Retourne les détails d'une candidature spécifique.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Candidature trouvée"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Candidature non trouvée")
    })
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplicationById(
            @Parameter(description = "ID de la candidature", required = true) @PathVariable Long id) {
        return applicationService.findByIdOptional(id)
                .map(application -> ResponseEntity.ok(ApiResponse.success(toResponse(application))))
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Récupérer les candidatures d'un utilisateur", 
               description = "Retourne toutes les candidatures soumises par un utilisateur spécifique.")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplicationsByUser(
            @Parameter(description = "ID de l'utilisateur", required = true) @PathVariable Long userId) {
        List<ApplicationResponse> applications = applicationService.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @GetMapping("/event/{eventId}")
    @Operation(summary = "Récupérer les candidatures d'un événement", 
               description = "Retourne toutes les candidatures pour un événement spécifique.")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplicationsByEvent(
            @Parameter(description = "ID de l'événement", required = true) @PathVariable Long eventId) {
        List<ApplicationResponse> applications = applicationService.findByEventId(eventId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(applications));
    }

    @PostMapping
    @Operation(summary = "Soumettre une candidature", 
               description = "Permet à un utilisateur de soumettre une candidature à un événement.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Candidature soumise"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Données invalides")
    })
    public ResponseEntity<ApiResponse<ApplicationResponse>> createApplication(@Valid @RequestBody ApplicationRequest request) {
        Application application = toEntity(request);
        Application savedApplication = applicationService.save(application);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedApplication), "Application submitted successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour une candidature", 
               description = "Met à jour une candidature (statut, etc.). Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Candidature mise à jour"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Candidature non trouvée")
    })
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplication(
            @Parameter(description = "ID de la candidature", required = true) @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        
        if (!applicationService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Application", "id", id);
        }

        Application application = toEntity(request);
        application.setId(id);
        Application savedApplication = applicationService.save(application);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedApplication), "Application updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Changer le statut d'une candidature",
               description = "Met à jour uniquement le statut d'une candidature. Réservé aux administrateurs.")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplicationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Application application = applicationService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        ApplicationStatus newStatus = ApplicationStatus.valueOf(body.get("status").toLowerCase());
        application.setStatus(newStatus);
        Application saved = applicationService.save(application);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Status updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une candidature", 
               description = "Supprime une candidature. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Candidature supprimée"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Candidature non trouvée")
    })
    public ResponseEntity<ApiResponse<Void>> deleteApplication(
            @Parameter(description = "ID de la candidature", required = true) @PathVariable Long id) {
        if (!applicationService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Application", "id", id);
        }
        applicationService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Application deleted successfully"));
    }

    private Application toEntity(ApplicationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

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
                .motivationText(request.getMotivationText())
                .technicalLevel(request.getTechnicalLevel())
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ApplicationResponse toResponse(Application application) {
        return ApplicationResponse.builder()
                .id(application.getId())
                .userId(application.getUser().getId())
                .username(application.getUser().getUsername())
                .eventId(application.getEvent() != null ? application.getEvent().getId() : null)
                .eventTitle(application.getEvent() != null ? application.getEvent().getTitle() : null)
                .applicationTypeId(application.getApplicationType().getId())
                .applicationTypeName(application.getApplicationType().getName().name())
                .status(application.getStatus())
                .motivationText(application.getMotivationText())
                .technicalLevel(application.getTechnicalLevel())
                .createdAt(application.getCreatedAt())
                .build();
    }
}
