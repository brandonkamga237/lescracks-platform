package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.dto.event.EventDetail;
import com.brandonkamga.lescracks.dto.event.EventRequest;
import com.brandonkamga.lescracks.dto.event.EventSummary;
import com.brandonkamga.lescracks.mapper.EventMapper;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@Tag(name = "Événements")
public class EventController {

    private final EventService events;
    private final EventMapper mapper;

    public EventController(EventService events, EventMapper mapper) {
        this.events = events;
        this.mapper = mapper;
    }

    @GetMapping
    @Operation(summary = "Les événements publiés, filtrables par type")
    public PageResponse<EventSummary> list(@RequestParam(required = false) EventKind kind,
                                           @PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(events.published(kind, pageable), mapper::toSummary);
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Les prochains événements")
    public PageResponse<EventSummary> upcoming(@PageableDefault(size = 4) Pageable pageable) {
        return PageResponse.of(events.upcoming(pageable), mapper::toSummary);
    }

    /** By slug rather than id: the slug is what is in a shared link. */
    @GetMapping("/{slug}")
    @Operation(summary = "Un événement")
    public EventDetail bySlug(@PathVariable String slug) {
        return mapper.toDetail(events.requireBySlug(slug));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tous les événements, publiés ou non")
    public PageResponse<EventSummary> all(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(events.all(pageable), mapper::toSummary);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public EventDetail create(@Valid @RequestBody EventRequest request) {
        return mapper.toDetail(events.create(toDraft(request)));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EventDetail update(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return mapper.toDetail(events.update(id, toDraft(request)));
    }

    /** Publishing is deliberate, never a side effect of editing. */
    @PutMapping("/admin/{id}/published")
    @PreAuthorize("hasRole('ADMIN')")
    public EventDetail setPublished(@PathVariable Long id, @RequestParam boolean published) {
        return mapper.toDetail(events.setPublished(id, published));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        events.delete(id);
    }

    private EventService.EventDraft toDraft(EventRequest request) {
        return new EventService.EventDraft(
                request.kind(), request.title(), request.summary(), request.description(),
                request.startsAt(), request.endsAt(), request.location(),
                request.capacity(), request.coverId());
    }
}
