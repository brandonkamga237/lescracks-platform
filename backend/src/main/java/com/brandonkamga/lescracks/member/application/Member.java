package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;

/** A member as other modules see them: who they are, their photo, what their public profile may show. */
@Value
@Builder
public class Member {
    Long id;
    String email;
    String firstName;
    String lastName;
    String avatarUrl;
    boolean active;
    boolean loginMethod;
    Instant createdAt;
    String bio;
    String location;
    Map<String, String> socialLinks;
    boolean publicBio;
    boolean publicLocation;
    boolean publicLinks;

    /** False for a newsletter-only contact: no password and no Google or GitHub login. */
    public boolean hasLoginMethod() {
        return loginMethod;
    }

    public static Member of(AccountSummary account, MemberProfile profile) {
        return Member.builder()
                .id(account.getId())
                .email(account.getEmail())
                .firstName(account.getFirstName())
                .lastName(account.getLastName())
                .avatarUrl(profile.getAvatarUrl())
                .active(account.isActive())
                .loginMethod(account.hasLoginMethod())
                .createdAt(account.getCreatedAt())
                .bio(profile.getBio())
                .location(profile.getLocation())
                .socialLinks(profile.getSocialLinks() == null ? Map.of() : Map.copyOf(profile.getSocialLinks()))
                .publicBio(profile.isPublicBio())
                .publicLocation(profile.isPublicLocation())
                .publicLinks(profile.isPublicLinks())
                .build();
    }
}
