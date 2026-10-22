package com.brandonkamga.lescracks.event.api;

import com.brandonkamga.lescracks.event.api.dto.EventRequest;
import com.brandonkamga.lescracks.event.api.dto.EventResponse;
import com.brandonkamga.lescracks.event.application.EventAdminService;
import com.brandonkamga.lescracks.event.application.EventCatalog;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.storage.api.Uploads;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private static final int MAX_PAGE_SIZE = 100;

    private final EventCatalog catalog;
    private final EventAdminService admin;

    public EventController(EventCatalog catalog, EventAdminService admin) {
        this.catalog = catalog;
        this.admin = admin;
    }

    @GetMapping
    public PageResponse<EventResponse> published(@RequestParam(required = false) EventType type,
                                                 @RequestParam(required = false) EventFormat format,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "12") int size) {
        return PageResponse.of(catalog.search(type, format, pageOf(page, size)), EventResponse::of);
    }

    @GetMapping("/upcoming")
    public PageResponse<EventResponse> upcoming(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "12") int size) {
        return PageResponse.of(catalog.listUpcoming(pageOf(page, size)), EventResponse::of);
    }

    @GetMapping("/past")
    public PageResponse<EventResponse> past(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "12") int size) {
        return PageResponse.of(catalog.listPast(pageOf(page, size)), EventResponse::of);
    }

    @GetMapping("/{slug}")
    public EventResponse get(@PathVariable String slug) {
        return EventResponse.of(catalog.requirePublished(slug));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<EventResponse> all(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(admin.list(pageOf(page, size)), EventResponse::of);
    }

    @PostMapping(value = "/admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@Valid @RequestPart("data") EventRequest request,
                                @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return EventResponse.of(admin.create(request.toDraft(), Uploads.of(coverImageFile)));
    }

    @PutMapping(value = "/admin/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public EventResponse update(@PathVariable Long id,
                                @Valid @RequestPart("data") EventRequest request,
                                @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return EventResponse.of(admin.update(id, request.toDraft(), Uploads.of(coverImageFile)));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        admin.delete(id);
    }

    private static PageQuery pageOf(int page, int size) {
        return new PageQuery(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
    }
}
