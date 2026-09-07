package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventType;
import com.brandonkamga.lescracks.domain.EventFormat;
import com.brandonkamga.lescracks.dto.event.EventRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EventService {
    Page<Event> published(EventType type, Pageable pageable);
    Page<Event> published(EventType type, EventFormat format, Pageable pageable);
    Page<Event> upcoming(Pageable pageable);
    Page<Event> past(Pageable pageable);
    Page<Event> all(Pageable pageable);
    Event require(Long id);
    Event create(EventRequest request, MultipartFile coverImageFile);
    Event update(Long id, EventRequest request, MultipartFile coverImageFile);
    void delete(Long id);
}
