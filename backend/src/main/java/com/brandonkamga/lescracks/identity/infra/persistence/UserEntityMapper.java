package com.brandonkamga.lescracks.identity.infra.persistence;

import com.brandonkamga.lescracks.identity.domain.member.User;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

/** Copies between the domain's User and the users row; the only place that knows both shapes. */
final class UserEntityMapper {

    private UserEntityMapper() {
    }

    static User toDomain(UserEntity entity) {
        return User.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .passwordHash(entity.getPasswordHash())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .username(entity.getUsername())
                .avatarUrl(entity.getAvatarUrl())
                .bio(entity.getBio())
                .location(entity.getLocation())
                .socialLinks(entity.getSocialLinks() == null ? new HashMap<>() : new HashMap<>(entity.getSocialLinks()))
                .publicBio(entity.isPublicBio())
                .publicLocation(entity.isPublicLocation())
                .publicLinks(entity.isPublicLinks())
                .status(entity.getStatus())
                .emailVerified(entity.isEmailVerified())
                .provider(entity.getProvider())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lastSeenAt(entity.getLastSeenAt())
                .phone(entity.getPhone())
                .country(entity.getCountry())
                .situation(entity.getSituation())
                .goal(entity.getGoal())
                .interests(new HashSet<>(entity.getInterests()))
                .marketingConsent(entity.isMarketingConsent())
                .onboardedAt(entity.getOnboardedAt())
                .signupPath(entity.getSignupPath())
                .signupLanguage(entity.getSignupLanguage())
                .signupTimezone(entity.getSignupTimezone())
                .build();
    }

    /**
     * lastSeenAt is only written on insert: afterwards LastSeenFilter owns it, and a save holding
     * an older copy must not roll it back.
     */
    static void copy(User user, UserEntity entity) {
        if (entity.getId() == null) entity.setLastSeenAt(user.getLastSeenAt());
        entity.setEmail(user.getEmail());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());
        entity.setUsername(user.getUsername());
        entity.setAvatarUrl(user.getAvatarUrl());
        entity.setBio(user.getBio());
        entity.setLocation(user.getLocation());
        entity.setSocialLinks(user.getSocialLinks() == null ? new HashMap<>() : new HashMap<>(user.getSocialLinks()));
        entity.setPublicBio(user.isPublicBio());
        entity.setPublicLocation(user.isPublicLocation());
        entity.setPublicLinks(user.isPublicLinks());
        entity.setStatus(user.getStatus());
        entity.setEmailVerified(user.isEmailVerified());
        entity.setProvider(user.getProvider());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(user.getCreatedAt());
        entity.setUpdatedAt(user.getUpdatedAt());
        entity.setPhone(user.getPhone());
        entity.setCountry(user.getCountry());
        entity.setSituation(user.getSituation());
        entity.setGoal(user.getGoal());
        // Changed in place so Hibernate writes the difference, not a delete-all and re-insert.
        Set<Long> interests = user.getInterests() == null ? Set.of() : user.getInterests();
        entity.getInterests().retainAll(interests);
        entity.getInterests().addAll(interests);
        entity.setMarketingConsent(user.isMarketingConsent());
        entity.setOnboardedAt(user.getOnboardedAt());
        entity.setSignupPath(user.getSignupPath());
        entity.setSignupLanguage(user.getSignupLanguage());
        entity.setSignupTimezone(user.getSignupTimezone());
    }
}
