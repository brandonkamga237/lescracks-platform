package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.event.infra.EventRegistrationRepository;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class EventRegistrationServiceImpl implements EventRegistrationService {
    private static final Logger log = LoggerFactory.getLogger(EventRegistrationServiceImpl.class);

    private final EventRegistrationRepository registrations;
    private final EventService events;
    private final MemberDirectory people;

    public EventRegistrationServiceImpl(EventRegistrationRepository registrations, EventService events, MemberDirectory people) {
        this.registrations = registrations;
        this.events = events;
        this.people = people;
    }

    @Override
    public EventRegistration register(Long eventId, String email) {
        Event event = requirePublished(eventId);
        Instant end = event.getEndDate() != null ? event.getEndDate() : event.getStartDate();
        if (end.isBefore(Instant.now())) throw new BadRequestException("Cet événement est terminé : les inscriptions sont closes.");
        Member member = people.require(email);
        return signUp(event, member.getId());
    }

    @Override
    public void ensureRegistered(Event event, Long userId) {
        signUp(event, userId);
    }

    private EventRegistration signUp(Event event, Long userId) {
        Optional<EventRegistration> existing = registrations.findByEventIdAndUserId(event.getId(), userId);
        if (existing.isPresent() && existing.get().getStatus() != RegistrationStatus.CANCELLED) return existing.get();
        EventRegistration registration = existing.orElseGet(() -> EventRegistration.builder().event(event).userId(userId).build());
        registration.setStatus(RegistrationStatus.REGISTERED);
        registration.setUpdatedAt(Instant.now());
        EventRegistration saved = registrations.save(registration);
        registrations.shiftRegistrationCount(event.getId(), 1);
        log.info("Member {} registered for event {}", userId, event.getId());
        return saved;
    }

    @Override
    public void cancel(Long eventId, String email) {
        Member member = people.require(email);
        registrations.findByEventIdAndUserId(eventId, member.getId())
                .filter(registration -> registration.getStatus() == RegistrationStatus.REGISTERED)
                .ifPresent(registration -> {
                    registration.setStatus(RegistrationStatus.CANCELLED);
                    registration.setUpdatedAt(Instant.now());
                    registrations.shiftRegistrationCount(eventId, -1);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EventRegistration> find(Long eventId, String email) {
        return people.find(email).flatMap(member -> registrations.findByEventIdAndUserId(eventId, member.getId()))
                .filter(registration -> registration.getStatus() != RegistrationStatus.CANCELLED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventRegistration> mine(String email) {
        Member member = people.require(email);
        return registrations.findForMember(member.getId(), EnumSet.of(RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED, RegistrationStatus.ABSENT));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationView> forEvent(Long eventId) {
        events.require(eventId);
        List<EventRegistration> list = registrations.findByEventIdOrderByCreatedAtAsc(eventId);
        Map<Long, Member> members = people.findAll(list.stream().map(EventRegistration::getUserId).toList());
        return list.stream().filter(registration -> members.containsKey(registration.getUserId()))
                .map(registration -> new RegistrationView(registration, members.get(registration.getUserId()))).toList();
    }

    @Override
    public EventRegistration markAttendance(Long registrationId, RegistrationStatus status) {
        if (status != RegistrationStatus.ATTENDED && status != RegistrationStatus.ABSENT) {
            throw new BadRequestException("Indique « présent » ou « absent ».");
        }
        EventRegistration registration = registrations.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Inscription", "id", registrationId));
        if (registration.getStatus() == RegistrationStatus.CANCELLED) throw new BadRequestException("Cette inscription a été annulée.");
        registration.setStatus(status);
        registration.setUpdatedAt(Instant.now());
        return registration;
    }

    private Event requirePublished(Long eventId) {
        Event event = events.require(eventId);
        if (event.getStatus() != EventStatus.PUBLISHED) throw new NotFoundException("Event", "id", eventId);
        return event;
    }
}
