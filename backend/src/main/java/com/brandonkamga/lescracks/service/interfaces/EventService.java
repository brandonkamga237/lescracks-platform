package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Event;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for Event operations.
 */
public interface EventService {

    /**
     * Find an event by ID.
     *
     * @param id the event ID
     * @return the event if found
     */
    Event findById(Long id);

    /**
     * Find an event by ID as Optional.
     *
     * @param id the event ID
     * @return Optional containing the event if found
     */
    Optional<Event> findByIdOptional(Long id);

    /**
     * Find all events.
     *
     * @return list of all events
     */
    List<Event> findAll();

    /**
     * Find events by event type ID.
     *
     * @param eventTypeId the event type ID
     * @return list of events with the specified type
     */
    List<Event> findByEventTypeId(Long eventTypeId);

    /**
     * Find events by event status ID.
     *
     * @param eventStatusId the event status ID
     * @return list of events with the specified status
     */
    List<Event> findByEventStatusId(Long eventStatusId);

    /**
     * Save an event.
     *
     * @param event the event to save
     * @return the saved event
     */
    Event save(Event event);

    /**
     * Delete an event by ID.
     *
     * @param id the event ID
     */
    void deleteById(Long id);
}
