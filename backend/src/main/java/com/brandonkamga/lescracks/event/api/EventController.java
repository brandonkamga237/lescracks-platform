package com.brandonkamga.lescracks.event.api;

import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.event.api.dto.EventRequest;
import com.brandonkamga.lescracks.event.api.dto.EventResponse;
import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.event.domain.EventType;
import com.brandonkamga.lescracks.shared.dto.PageResponse;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService events;
    private final EngagementCounts engagement;

    public EventController(EventService events, EngagementCounts engagement) {
        this.events = events;
        this.engagement = engagement;
    }

    @GetMapping
    public PageResponse<EventResponse> published(@RequestParam(required = false) EventType type,
                                                 @RequestParam(required = false) EventFormat format,
                                                 @PageableDefault(size = 12) Pageable pageable) {
        return page(events.published(type, format, pageable));
    }

    @GetMapping("/upcoming")
    public PageResponse<EventResponse> upcoming(@PageableDefault(size = 12) Pageable pageable) {
        return page(events.upcoming(pageable));
    }

    @GetMapping("/past")
    public PageResponse<EventResponse> past(@PageableDefault(size = 12) Pageable pageable) {
        return page(events.past(pageable));
    }

    @GetMapping("/{slug}")
    public EventResponse get(@PathVariable String slug) {
        Event event = events.requireBySlugOrId(slug);
        if (event.getStatus() != com.brandonkamga.lescracks.event.domain.EventStatus.PUBLISHED) {
            throw new com.brandonkamga.lescracks.shared.exception.NotFoundException("Event", "slug", slug);
        }
        return response(event);
    }


    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<EventResponse> all(@PageableDefault(size = 20) Pageable pageable) {
        return page(events.all(pageable));
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

    /** The views of the whole page in one query. */
    private PageResponse<EventResponse> page(Page<Event> found) {
        Map<Long, Counts> counts = engagement.countsOf(TargetType.EVENT, found.getContent().stream().map(Event::getId).toList());
        return PageResponse.of(found, event -> response(event, counts.get(event.getId())));
    }

    private EventResponse response(Event event) {
        return response(event, engagement.countsOf(Target.event(event.getId())));
    }

    private static EventResponse response(Event event, Counts counts) {
        return new EventResponse(event.getId(), event.getSlug(), event.getTitle(), event.getDescription(), event.getType(),
                event.getFormat(), event.getStartDate(), event.getEndDate(), event.getLocation(), event.getCoverImage(),
                event.getStatus(), event.getCreatedAt(), event.getUpdatedAt(), event.getScheduledAt(), counts == null ? 0 : counts.views(),
                event.getRegistrationCount(), event.isAcceptsSubmissions(), event.getMaxTeamSize(), event.submissionsCloseAt());
    }
}
