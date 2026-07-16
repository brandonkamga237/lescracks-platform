package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.EventStatusEnum;
import com.brandonkamga.lescracks.exception.ForbiddenException;
import com.brandonkamga.lescracks.repository.ApplicationRepository;
import org.springframework.security.core.Authentication;
import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationType;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ApplicationRequest;
import com.brandonkamga.lescracks.dto.ApplicationResponse;
import com.brandonkamga.lescracks.exception.BadRequestException;
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
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ApplicationTypeRepository applicationTypeRepository;
    private final MailServiceImpl mailService;

    public ApplicationController(
            ApplicationService applicationService,
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            EventRepository eventRepository,
            ApplicationTypeRepository applicationTypeRepository,
            MailServiceImpl mailService) {
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
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

    /**
     * Public list of application types.
     *
     * The frontend needs the id of the "register" type to sign someone up for an
     * event. Hard-coding that id in the client would silently break the moment the
     * ids differ between environments, so it is resolved by name instead.
     */
    @GetMapping("/types")
    @Operation(summary = "Lister les types de candidature (public)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getApplicationTypes() {
        List<Map<String, Object>> types = applicationTypeRepository.findAll().stream()
                .map(t -> Map.<String, Object>of("id", t.getId(), "name", t.getName().name()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(types));
    }

    /**
     * Two different things come through here, with deliberately different rules:
     *
     *  - An Accompagnement 360 application (no eventId) stays fully public. Asking a
     *    stranger to create an account before they can even apply is how you lose them.
     *
     *  - Signing up for an event (eventId present) REQUIRES an account. We need to know
     *    who is actually coming, be able to reach them, and stop the same person from
     *    taking three of the twenty seats.
     */
    @PostMapping
    @Operation(summary = "Soumettre une candidature (publique) ou s'inscrire à un événement (compte requis)")
    public ResponseEntity<ApiResponse<ApplicationResponse>> createApplication(
            @Valid @RequestBody ApplicationRequest request,
            Authentication authentication) {

        if (request.getEventId() != null) {
            return ResponseEntity.ok(registerForEvent(request, authentication));
        }

        // Bean validation can't express "required here, optional there", so the public
        // path checks its own required fields. Without this, dropping @NotBlank from the
        // DTO would let a nameless, unreachable application through.
        requireField(request.getFullName(), "Le nom complet est obligatoire.");
        requireField(request.getEmailAddress(), "L'adresse email est obligatoire.");
        requireField(request.getWhatsappNumber(), "Le numéro WhatsApp est obligatoire.");

        Application application = toEntity(request);
        Application saved = applicationService.save(application);
        return ResponseEntity.ok(ApiResponse.success(toResponse(saved), "Candidature soumise avec succès"));
    }

    private void requireField(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    /** Event sign-up: account required, one seat per person, and only while there is room. */
    private ApiResponse<ApplicationResponse> registerForEvent(
            ApplicationRequest request, Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ForbiddenException(
                    "Tu dois créer un compte ou te connecter pour t'inscrire à un événement.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ForbiddenException("Compte introuvable. Reconnecte-toi."));

        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", request.getEventId()));

        EventStatusEnum status = event.deriveStatus();
        if (status == EventStatusEnum.closed) {
            throw new BadRequestException("Cet événement est terminé, les inscriptions sont closes.");
        }

        if (applicationRepository.existsByUser_IdAndEvent_Id(user.getId(), event.getId())) {
            throw new BadRequestException("Tu es déjà inscrit à cet événement.");
        }

        // Capacity is derived, so this check reads the live number of seats taken.
        Integer max = event.getMaxParticipants();
        if (max != null && applicationRepository.countByEvent_Id(event.getId()) >= max) {
            throw new BadRequestException("Cet événement est complet.");
        }

        ApplicationType type = applicationTypeRepository.findById(request.getApplicationTypeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ApplicationType", "id", request.getApplicationTypeId()));

        Application application = Application.builder()
                .user(user)
                .event(event)
                .applicationType(type)
                // Fall back to the account details, so the form doesn't re-ask for what we know.
                .fullName(request.getFullName() != null && !request.getFullName().isBlank()
                        ? request.getFullName() : user.getUsername())
                .emailAddress(request.getEmailAddress() != null && !request.getEmailAddress().isBlank()
                        ? request.getEmailAddress() : user.getEmail())
                .whatsappNumber(request.getWhatsappNumber())
                .motivationText(request.getMotivationText())
                .technicalLevel(request.getTechnicalLevel())
                .age(request.getAge())
                .createdAt(LocalDateTime.now())
                .build();

        Application saved = applicationService.save(application);
        return ApiResponse.success(toResponse(saved), "Inscription confirmée !");
    }

    /**
     * Archive or un-archive. This is the whole lifecycle now — set aside, or bring back.
     * The old seven-stage funnel and its auto-email on "accepted" are gone: a candidate
     * list needs a way to tidy itself, not a CRM.
     */
    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Archiver une candidature — admin uniquement")
    public ResponseEntity<ApiResponse<ApplicationResponse>> archive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(setArchived(id, true), "Candidature archivée"));
    }

    @PatchMapping("/{id}/unarchive")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Désarchiver une candidature — admin uniquement")
    public ResponseEntity<ApiResponse<ApplicationResponse>> unarchive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(setArchived(id, false), "Candidature désarchivée"));
    }

    private ApplicationResponse setArchived(Long id, boolean archived) {
        Application application = applicationService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        application.setArchivedAt(archived ? LocalDateTime.now() : null);
        return toResponse(applicationService.save(application));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Supprimer une candidature — admin uniquement")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable Long id) {
        // The admin is free to delete any application — there is no protected state anymore.
        applicationService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
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
                .eventRegistration(app.isEventRegistration())
                .archived(app.isArchived())
                .archivedAt(app.getArchivedAt())
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
