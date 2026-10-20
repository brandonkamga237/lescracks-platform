package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.domain.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.RegistrationView;

import java.time.Instant;

public record AdminRegistrationResponse(Long id, Long userId, String name, String email, RegistrationStatus status, Instant registeredAt) {

    public static AdminRegistrationResponse of(RegistrationView view) {
        var member = view.member();
        String name = ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim();
        return new AdminRegistrationResponse(view.registration().getId(), member.getId(), name, member.getEmail(),
                view.registration().getStatus(), view.registration().getCreatedAt());
    }
}
