package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of EventService.
 */
@Service
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    public EventServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Event findById(Long id) {
        return eventRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Event> findByIdOptional(Long id) {
        return eventRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> findAll() {
        return eventRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> findByEventTypeId(Long eventTypeId) {
        return eventRepository.findByEventTypeId(eventTypeId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Event> findByEventStatusId(Long eventStatusId) {
        return eventRepository.findByEventStatusId(eventStatusId);
    }

    @Override
    public Event save(Event event) {
        return eventRepository.save(event);
    }

    @Override
    public void deleteById(Long id) {
        eventRepository.deleteById(id);
    }
}
