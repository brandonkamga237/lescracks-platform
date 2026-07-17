package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventStatusEnum;
import com.brandonkamga.lescracks.domain.EventType;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.EventRequest;
import com.brandonkamga.lescracks.dto.EventResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.ApplicationRepository;
import com.brandonkamga.lescracks.repository.EventRepository;
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
@io.swagger.v3.oas.annotations.tags.Tag(name = "Events", description = "Event and training management API")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

    private final EventService eventService;
    private final EventRepository eventRepository;
    private final EventTypeRepository eventTypeRepository;
    private final EventStatusRepository eventStatusRepository;
    private final TagRepository tagRepository;
    private final ApplicationRepository applicationRepository;

    public EventController(
            EventService eventService,
            EventRepository eventRepository,
            EventTypeRepository eventTypeRepository,
            EventStatusRepository eventStatusRepository,
            TagRepository tagRepository,
            ApplicationRepository applicationRepository) {
        this.eventService = eventService;
        this.eventRepository = eventRepository;
        this.eventTypeRepository = eventTypeRepository;
        this.eventStatusRepository = eventStatusRepository;
        this.tagRepository = tagRepository;
        this.applicationRepository = applicationRepository;
    }

    @GetMapping
    @Operation(summary = "List all events",
               description = "Returns the list of all available events.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Event list")
    })
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        List<EventResponse> events = eventService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID",
               description = "Returns the details of a specific event.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Event found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "Event not found")
    })
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(
            @Parameter(description = "Event ID", required = true) @PathVariable Long id) {
        return eventService.findByIdOptional(id)
                .map(event -> ResponseEntity.ok(ApiResponse.success(toResponse(event))))
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get event by SEO slug",
               description = "Returns an event by its public slug. This is the public URL identifier; the numeric id stays internal.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Event found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "Event not found")
    })
    public ResponseEntity<ApiResponse<EventResponse>> getEventBySlug(
            @Parameter(description = "Event slug", required = true) @PathVariable String slug) {
        return eventRepository.findBySlug(slug)
                .map(event -> ResponseEntity.ok(ApiResponse.success(toResponse(event))))
                .orElseThrow(() -> new ResourceNotFoundException("Event", "slug", slug));
    }

    @GetMapping("/type/{eventTypeId}")
    @Operation(summary = "Get events by type",
               description = "Filters events by type (training, workshop, etc.)")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByType(
            @Parameter(description = "Event type ID", required = true) @PathVariable Long eventTypeId) {
        List<EventResponse> events = eventService.findByEventTypeId(eventTypeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/status/{eventStatusId}")
    @Operation(summary = "Get events by status",
               description = "Filters events by status (active, ended, etc.)")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getEventsByStatus(
            @Parameter(description = "Event status ID", required = true) @PathVariable Long eventStatusId) {
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
    @Operation(summary = "Create a new event",
               description = "Creates a new event. Reserved for administrators.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Event created"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden - reserved for administrators")
    })
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(@Valid @RequestBody EventRequest request) {
        Event event = toEntity(request);
        event.setSlug(generateUniqueSlug(event.getTitle()));
        Event savedEvent = eventService.save(event);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedEvent), "Event created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an event",
               description = "Updates an existing event. Reserved for administrators.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Event updated"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden - reserved for administrators"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "Event not found")
    })
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @Parameter(description = "Event ID", required = true) @PathVariable Long id,
            @Valid @RequestBody EventRequest request) {
        
        Event existing = eventService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));

        Event event = toEntity(request);
        event.setId(id);
        // The slug is generated once, at creation, and kept stable across edits so a
        // shared or indexed link never breaks — even if the title changes.
        event.setSlug(existing.getSlug());
        Event savedEvent = eventService.save(event);
        return ResponseEntity.ok(ApiResponse.success(toResponse(savedEvent), "Event updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an event",
               description = "Deletes an event. Reserved for administrators.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Event deleted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden - reserved for administrators"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "Event not found")
    })
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @Parameter(description = "Event ID", required = true) @PathVariable Long id) {
        if (!eventService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("Event", "id", id);
        }
        eventService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Event deleted successfully"));
    }

    /** Look up the EventStatus row matching what the dates say the event currently is. */
    private EventStatus resolveStatusFromDates(LocalDateTime start, LocalDateTime end) {
        EventStatusEnum derived = Event.builder()
                .eventDate(start)
                .endDate(end)
                .build()
                .deriveStatus();

        return eventStatusRepository.findByName(derived)
                .orElseThrow(() -> new ResourceNotFoundException("EventStatus", "name", derived.name()));
    }

    private Event toEntity(EventRequest request) {
        EventType eventType = eventTypeRepository.findById(request.getEventTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("EventType", "id", request.getEventTypeId()));

        // The status is no longer chosen by hand — it follows the dates. The column is
        // still NOT NULL, so we persist whatever the dates say at save time; reads always
        // re-derive it, so a stale row can never surface as a wrong status.
        EventStatus eventStatus = resolveStatusFromDates(request.getEventDate(), request.getEndDate());

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
                .maxParticipants(request.getMaxParticipants())
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
                .slug(event.getSlug())
                .title(event.getTitle())
                .description(event.getDescription())
                .startDate(event.getEventDate() != null ? event.getEventDate().toString() : null)
                .endDate(event.getEndDate() != null ? event.getEndDate().toString() : null)
                .location(event.getLocation())
                .coverImageUrl(event.getCoverImageUrl())
                .type(event.getEventType().getName())
                // Derived from the dates, never read from the stored column: a status
                // someone typed in is correct the day they set it and wrong the next.
                .status(event.deriveStatus().name())
                .applicationRequired(event.getApplicationRequired())
                .maxParticipants(event.getMaxParticipants())
                .currentParticipants(applicationRepository.countByEvent_Id(event.getId()))
                .createdAt(event.getCreatedAt())
                .eventTypeId(event.getEventType().getId())
                .eventStatusId(event.getEventStatus().getId())
                .tags(tags)
                .build();
    }

    /**
     * Slugify a title the same way the rest of the app does (see ResourceServiceImpl):
     * lowercase, strip accents to ascii, drop anything non-alphanumeric, collapse spaces
     * into single dashes, trim. Empty/edge titles fall back to "evenement".
     */
    private String slugify(String title) {
        if (title == null) return "evenement";
        String base = title.toLowerCase()
                .replaceAll("[àáâãäå]", "a")
                .replaceAll("[èéêë]", "e")
                .replaceAll("[ìíîï]", "i")
                .replaceAll("[òóôõö]", "o")
                .replaceAll("[ùúûü]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return base.isBlank() ? "evenement" : base;
    }

    /** Slugify + guarantee uniqueness with a numeric suffix (-2, -3, …), like learners. */
    private String generateUniqueSlug(String title) {
        String base = slugify(title);
        String slug = base;
        int counter = 2;
        while (eventRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
