package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventType;
import com.brandonkamga.lescracks.domain.EventFormat;
import com.brandonkamga.lescracks.dto.event.EventRequest;
import com.brandonkamga.lescracks.dto.event.EventResponse;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import jakarta.validation.Valid;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService events;

    public EventController(EventService events) {
        this.events = events;
    }

    @GetMapping
    public PageResponse<EventResponse> published(@RequestParam(required = false) EventType type,
                                                 @RequestParam(required = false) EventFormat format,
                                                 @PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(events.published(type, format, pageable), EventController::response);
    }

    @GetMapping("/upcoming")
    public PageResponse<EventResponse> upcoming(@PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(events.upcoming(pageable), EventController::response);
    }

    @GetMapping("/past")
    public PageResponse<EventResponse> past(@PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(events.past(pageable), EventController::response);
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable Long id) {
        Event event = events.require(id);
        if (event.getStatus() != com.brandonkamga.lescracks.domain.EventStatus.PUBLISHED) {
            throw new com.brandonkamga.lescracks.exception.NotFoundException("Event", "id", id);
        }
        return response(event);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<EventResponse> all(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(events.all(pageable), EventController::response);
    }

    @PostMapping(value = "/admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@Valid @RequestPart("data") EventRequest request,
                                @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return response(events.create(request, coverImageFile));
    }

    @PutMapping(value = "/admin/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse update(@PathVariable Long id,
                                @Valid @RequestPart("data") EventRequest request,
                                @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return response(events.update(id, request, coverImageFile));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { events.delete(id); }

    private static EventResponse response(Event event) {
        return new EventResponse(event.getId(), event.getTitle(), event.getDescription(), event.getType(),
                event.getFormat(), event.getStartDate(), event.getEndDate(), event.getLocation(), event.getCoverImage(),
                event.getStatus(), event.getCreatedAt(), event.getUpdatedAt());
    }
}
