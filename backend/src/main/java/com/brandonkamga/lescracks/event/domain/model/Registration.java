package com.brandonkamga.lescracks.event.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A member signed up for an event. The member is kept as an id: account owns people. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Registration {
    private Long id;
    private Long eventId;
    private Long userId;

    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.REGISTERED;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public boolean isActive() {
        return status != RegistrationStatus.CANCELLED;
    }

    public void reopen() {
        status = RegistrationStatus.REGISTERED;
        updatedAt = Instant.now();
    }

    public void cancel() {
        status = RegistrationStatus.CANCELLED;
        updatedAt = Instant.now();
    }

    /** After the event: ATTENDED or ABSENT, or back to REGISTERED to undo a mistaken click; never on a cancelled registration. */
    public void markAttendance(RegistrationStatus attendance) {
        if (attendance == null || attendance == RegistrationStatus.CANCELLED) {
            throw new BadRequestException("Indique « présent », « absent » ou « non pointé ».");
        }
        if (status == RegistrationStatus.CANCELLED) throw new BadRequestException("Cette inscription a été annulée.");
        status = attendance;
        updatedAt = Instant.now();
    }
}
