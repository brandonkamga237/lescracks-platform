package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventType;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.EventRequest;
import com.brandonkamga.lescracks.dto.EventResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.EventStatusRepository;
import com.brandonkamga.lescracks.repository.EventTypeRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.service.interfaces.EventService;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Événements", description = "API de gestion des événements et formations")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

    private final EventService eventService;
    private final EventTypeRepository eventTypeRepository;
    private final EventStatusRepository eventStatusRepository;
    private final TagRepository tagRepository;

    public EventController(
            EventService eventService,
            EventTypeRepository eventTypeRepository,
            EventStatusRepository eventStatusRepository,
            TagRepository tagRepository) {
        this.eventService = eventService;
        this.eventTypeRepository = eventTypeRepository;
        this.eventStatusRepository = eventStatusRepository;
        this.tagRepository = tagRepository;
    }

    @GetMapping
    @Operation(summary = "Liste tous les événements", 
               description = "Retourne la liste de tous les événements disponibles.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Liste des événements")
    })
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        List<EventResponse> events = eventService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un événement par ID", 
               description = "Retourne les détails d'un événement spécifique.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Événement trouvé"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Événement non trouvé")
    })
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(
            @Parameter(description = "ID de l'événement", required = true) @PathVariable Long id) {
        return eventService.findByIdOptional(id)
                .map(event -> ResponseEntity.ok(ApiResponse.success(toResponse(event))))
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
    }

    @GetMapping("/type/{eventTypeId}")
    @Operation(summary = "Récupérer les événements par type", 
               description = "Filtre les événements par type (formation, workshop, etc.)")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByType(
            @Parameter(description = "ID du type d'événement", required = true) @PathVariable Long eventTypeId) {
        List<EventResponse> events = eventService.findByEventTypeId(eventTypeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/status/{eventStatusId}")
    @Operation(summary = "Récupérer les événements par statut", 
               description = "Filtre les événements par statut (actif, terminé, etc.)")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByStatus(
            @Parameter(description = "ID du statut d'événement", required = true) @PathVariable Long eventStatusId) {
        List<EventResponse> events = eventService.findByEventStatusId(eventStatusId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/types")
    @Operation(summary = "Liste les types d'événements")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> getEventTypes() {
        List<java.util.Map<String, Object>> types = eventTypeRepository.findAll().stream()
                .map(t -> { var m = new java.util.HashMap<String, Object>(); m.put("id", t.getId()); m.put("name", t.getName()); return (java.util.Map<String, Object>) m; })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(types));
    }

    @GetMapping("/statuses")
    @Operation(summary = "Liste les statuts d'événements")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> getEventStatuses() {
        List<java.util.Map<String, Object>> statuses = eventStatusRepository.findAll().stream()
                .map(s -> { var m = new java.util.HashMap<String, Object>(); m.put("id", s.getId()); m.put("name", s.getName().name()); return (java.util.Map<String, Object>) m; })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(statuses));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Créer un nouvel événement", 
               description = "Crée un nouvel événement. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Événement créé"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs")
    })
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(@Valid @RequestBody EventRequest request) {
        Event event = toEntity(request);
        Event savedEvent = eventService.save(event);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedEvent), "Event created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour un événement", 
               description = "Met à jour un événement existant. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Événement mis à jour"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Événement non trouvé")
    })
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @Parameter(description = "ID de l'événement", required = true) @PathVariable Long id,
            @Valid @RequestBody EventRequest request) {
        
        if (!eventService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Event", "id", id);
        }

        Event event = toEntity(request);
        event.setId(id);
        Event savedEvent = eventService.save(event);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedEvent), "Event updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un événement", 
               description = "Supprime un événement. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Événement supprimé"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Événement non trouvé")
    })
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @Parameter(description = "ID de l'événement", required = true) @PathVariable Long id) {
        if (!eventService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Event", "id", id);
        }
        eventService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Event deleted successfully"));
    }

    private Event toEntity(EventRequest request) {
        EventType eventType = eventTypeRepository.findById(request.getEventTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("EventType", "id", request.getEventTypeId()));
        
        EventStatus eventStatus = eventStatusRepository.findById(request.getEventStatusId())
                .orElseThrow(() -> new ResourceNotFoundException("EventStatus", "id", request.getEventStatusId()));

        Set<Tag> tags = new HashSet<>();
        if (request.getTagIds() != null) {
            tags = new HashSet<>(tagRepository.findAllById(request.getTagIds()));
        }

        return Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .endDate(request.getEndDate())
                .location(request.getLocation())
                .coverImageUrl(request.getCoverImageUrl())
                .applicationRequired(request.getApplicationRequired())
                .eventType(eventType)
                .eventStatus(eventStatus)
                .tags(tags)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private EventResponse toResponse(Event event) {
        Set<EventResponse.TagDto> tags = event.getTags().stream()
                .map(tag -> EventResponse.TagDto.builder()
                        .id(tag.getId())
                        .name(tag.getName())
                        .build())
                .collect(Collectors.toSet());

        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startDate(event.getEventDate() != null ? event.getEventDate().toString() : null)
                .endDate(event.getEndDate() != null ? event.getEndDate().toString() : null)
                .location(event.getLocation())
                .coverImageUrl(event.getCoverImageUrl())
                .type(event.getEventType().getName())
                .status(event.getEventStatus().getName().name())
                .applicationRequired(event.getApplicationRequired())
                .createdAt(event.getCreatedAt())
                .eventTypeId(event.getEventType().getId())
                .eventStatusId(event.getEventStatus().getId())
                .tags(tags)
                .build();
    }
}
