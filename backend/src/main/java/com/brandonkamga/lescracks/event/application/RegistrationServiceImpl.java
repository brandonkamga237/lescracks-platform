package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class RegistrationServiceImpl implements RegistrationService {
    private static final Logger log = LoggerFactory.getLogger(RegistrationServiceImpl.class);

    private final RegistrationStore registrations;
    private final EventStore events;
    private final MemberDirectory people;

    public RegistrationServiceImpl(RegistrationStore registrations, EventStore events, MemberDirectory people) {
        this.registrations = registrations;
        this.events = events;
        this.people = people;
    }

    @Override
    public Registration register(Long eventId, String email) {
        Event event = events.findById(eventId).filter(Event::isPublished)
                .orElseThrow(() -> new NotFoundException("Event", "id", eventId));
        if (event.isOver(Instant.now())) throw new BadRequestException("Cet événement est terminé : les inscriptions sont closes.");
        return signUp(eventId, people.require(email).getId());
    }

    @Override
    public void ensureRegistered(Long eventId, Collection<Long> userIds) {
        userIds.forEach(userId -> signUp(eventId, userId));
    }

    @Override
    public void forgetMember(Long userId) {
        registrations.releaseCountsOf(userId);
    }

    private Registration signUp(Long eventId, Long userId) {
        Optional<Registration> existing = registrations.find(eventId, userId);
        if (existing.isPresent() && existing.get().isActive()) return existing.get();
        Registration registration = existing.orElseGet(() -> Registration.builder().eventId(eventId).userId(userId).build());
        registration.reopen();
        Registration saved = registrations.save(registration);
        registrations.shiftCount(eventId, 1);
        log.info("Member {} registered for event {}", userId, eventId);
        return saved;
    }

    @Override
    public void cancel(Long eventId, String email) {
        Member member = people.require(email);
        registrations.find(eventId, member.getId())
                .filter(registration -> registration.getStatus() == RegistrationStatus.REGISTERED)
                .ifPresent(registration -> {
                    registration.cancel();
                    registrations.save(registration);
                    registrations.shiftCount(eventId, -1);
                });
    }

    @Override
    public Optional<Registration> find(Long eventId, String email) {
        return people.find(email).flatMap(member -> registrations.find(eventId, member.getId())).filter(Registration::isActive);
    }

    @Override
    public List<MyEvent> listMine(String email) {
        return listOf(people.require(email).getId());
    }

    @Override
    public List<MyEvent> listOf(Long userId) {
        List<Registration> mine = registrations.findActiveByMember(userId);
        Map<Long, Event> byId = events.findAllById(mine.stream().map(Registration::getEventId).toList()).stream()
                .collect(Collectors.toMap(Event::getId, Function.identity()));
        return mine.stream().filter(registration -> byId.containsKey(registration.getEventId()))
                .map(registration -> new MyEvent(registration, byId.get(registration.getEventId()))).toList();
    }

    @Override
    public List<RegistrationView> listForEvent(Long eventId) {
        events.findById(eventId).orElseThrow(() -> new NotFoundException("Event", "id", eventId));
        List<Registration> list = registrations.findByEvent(eventId);
        Map<Long, Member> members = people.findAll(list.stream().map(Registration::getUserId).toList());
        return list.stream().filter(registration -> members.containsKey(registration.getUserId()))
                .map(registration -> new RegistrationView(registration, members.get(registration.getUserId()))).toList();
    }

    @Override
    public Registration markAttendance(Long registrationId, RegistrationStatus status) {
        Registration registration = registrations.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Inscription", "id", registrationId));
        registration.markAttendance(status);
        return registrations.save(registration);
    }
}
