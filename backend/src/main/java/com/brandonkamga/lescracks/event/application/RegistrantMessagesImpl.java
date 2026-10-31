package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;
import com.brandonkamga.lescracks.mail.domain.EventUpdateEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.util.List;
import java.util.Map;

public class RegistrantMessagesImpl implements RegistrantMessages {
    static final int MAX_LENGTH = 2000;

    private final EventStore events;
    private final RegistrationStore registrations;
    private final MemberDirectory people;
    private final Mailer mail;

    public RegistrantMessagesImpl(EventStore events, RegistrationStore registrations, MemberDirectory people, Mailer mail) {
        this.events = events;
        this.registrations = registrations;
        this.people = people;
        this.mail = mail;
    }

    @Override
    public int write(Long eventId, String message) {
        String text = message == null ? "" : message.strip();
        if (text.isEmpty()) throw new BadRequestException("Écris le message à envoyer aux inscrits.");
        if (text.length() > MAX_LENGTH) throw new BadRequestException("Le message ne doit pas dépasser 2 000 caractères.");
        Event event = events.findById(eventId).orElseThrow(() -> new NotFoundException("Événement", "id", eventId));

        List<Long> registrantIds = registrations.findByEvent(eventId).stream()
                .filter(Registration::isActive).map(Registration::getUserId).toList();
        Map<Long, Member> members = people.findAll(registrantIds);
        int sent = 0;
        for (Long id : registrantIds) {
            Member member = members.get(id);
            // A suspended or banned account hears nothing more from the platform.
            if (member == null || !member.isActive()) continue;
            mail.send(new EventUpdateEmail(member.getEmail(), member.getFirstName(), event.getTitle(), event.path(), text,
                    event.submissionsCloseAt()));
            sent++;
        }
        return sent;
    }
}
