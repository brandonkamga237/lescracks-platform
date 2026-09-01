package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.dto.application.ApplicationResponse;
import org.springframework.stereotype.Component;

@Component
public class ApplicationMapper {

    /**
     * {@code hasAccount} is here because it decides what an admin can do next: accepting an
     * application with no account behind it cannot create a participation, and learning that
     * before the click beats learning it after.
     */
    public ApplicationResponse toResponse(Application application) {
        return new ApplicationResponse(
                application.getId(),
                application.getTarget(),
                application.getEvent() == null ? null : application.getEvent().getId(),
                application.getEvent() == null ? null : application.getEvent().getTitle(),
                application.getFullName(),
                application.getEmail(),
                application.getPhone(),
                application.getMotivation(),
                application.getStatus(),
                application.getUser() != null,
                application.getDecidedAt(),
                application.getCreatedAt());
    }
}
