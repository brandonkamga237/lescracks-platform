package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.identity.domain.User;

/** Someone named on a project. The email is shown to the team, who need it to edit the project. */
public record TeamMemberResponse(Long id, String name, String email, boolean owner) {

    public static TeamMemberResponse of(User member, Long ownerId) {
        String name = ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim();
        return new TeamMemberResponse(member.getId(), name.isEmpty() ? member.getEmail() : name, member.getEmail(), member.getId().equals(ownerId));
    }
}
