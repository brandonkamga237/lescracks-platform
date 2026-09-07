package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.EventType;
import com.brandonkamga.lescracks.domain.EventFormat;
import com.brandonkamga.lescracks.dto.event.EventRequest;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import com.brandonkamga.lescracks.service.interfaces.NewsletterService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class EventServiceImpl implements EventService {
    private final EventRepository events;
    private final NewsletterService newsletter;
    private final StorageService storage;

    public EventServiceImpl(EventRepository events, NewsletterService newsletter, StorageService storage) {
        this.events = events;
        this.newsletter = newsletter;
        this.storage = storage;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> published(EventType type, Pageable pageable) {
        return type == null
                ? events.findByStatusOrderByStartDateAsc(EventStatus.PUBLISHED, pageable)
                : events.findByStatusAndTypeOrderByStartDateAsc(EventStatus.PUBLISHED, type, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> published(EventType type, EventFormat format, Pageable pageable) {
        if (type != null && format != null) return events.findByStatusAndTypeAndFormatOrderByStartDateAsc(EventStatus.PUBLISHED, type, format, pageable);
        if (type != null) return events.findByStatusAndTypeOrderByStartDateAsc(EventStatus.PUBLISHED, type, pageable);
        if (format != null) return events.findByStatusAndFormatOrderByStartDateAsc(EventStatus.PUBLISHED, format, pageable);
        return events.findByStatusOrderByStartDateAsc(EventStatus.PUBLISHED, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> upcoming(Pageable pageable) {
        return events.findByStatusAndStartDateAfterOrderByStartDateAsc(EventStatus.PUBLISHED, Instant.now(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> past(Pageable pageable) {
        return events.findByStatusAndStartDateBeforeOrderByStartDateDesc(EventStatus.PUBLISHED, Instant.now(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Event> all(Pageable pageable) { return events.findAll(pageable); }

    @Override
    @Transactional(readOnly = true)
    public Event require(Long id) {
        return events.findById(id).orElseThrow(() -> new NotFoundException("Event", "id", id));
    }

    @Override
    public Event create(EventRequest request, MultipartFile coverImageFile) {
        validateDates(request.startDate(), request.endDate());
        Event event = events.save(apply(new Event(), request, coverImageFile));
        if (event.getStatus() == EventStatus.PUBLISHED) newsletter.notifyEventSubscribers(event);
        return event;
    }

    @Override
    public Event update(Long id, EventRequest request, MultipartFile coverImageFile) {
        validateDates(request.startDate(), request.endDate());
        return apply(require(id), request, coverImageFile);
    }

    @Override
    public void delete(Long id) {
        Event event = require(id);
        deleteCoverImage(event.getCoverImage());
        events.delete(event);
    }

    private Event apply(Event event, EventRequest request, MultipartFile coverImageFile) {
        event.setTitle(request.title().trim());
        event.setDescription(request.description().trim());
        event.setType(request.type());
        event.setFormat(request.format());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setLocation(request.location() == null ? null : request.location().trim());
        event.setStatus(request.status() == null ? EventStatus.DRAFT : request.status());
        event.setCoverImage(resolveCoverImage(coverImageFile, event.getCoverImage()));
        return event;
    }

    private String resolveCoverImage(MultipartFile coverImageFile, String existingCoverImage) {
        if (coverImageFile != null && !coverImageFile.isEmpty()) {
            validateImage(coverImageFile);
            try {
                String key = storage.store(coverImageFile.getOriginalFilename(), coverImageFile.getBytes(), coverImageFile.getContentType());
                return "/api/files/" + key;
            } catch (IOException exception) {
                throw new BadRequestException("L'image de couverture n'a pas pu être lue.");
            }
        }
        if (existingCoverImage != null && !existingCoverImage.isBlank()) return existingCoverImage;
        return null;
    }

    private void validateImage(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("L'image de couverture doit être au format image (jpg, png, webp, …).");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("L'image de couverture ne doit pas dépasser 5 Mo.");
        }
    }

    private void deleteCoverImage(String coverImage) {
        if (coverImage == null || !coverImage.startsWith("/api/files/")) return;
        String key = coverImage.substring("/api/files/".length());
        if (!key.isBlank()) storage.delete(key);
    }

    private void validateDates(Instant start, Instant end) {
        if (end != null && end.isBefore(start)) {
            throw new BadRequestException("La date de fin ne peut pas précéder la date de début.");
        }
    }
}
