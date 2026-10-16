package com.brandonkamga.lescracks.identity.domain;

/**
 * Published inside the sign-up transaction. Other domains react to it (the newsletter
 * subscribes the member who asked for it) without identity knowing they exist.
 */
public record MemberRegistered(String email, boolean wantsNewsletter) {
}
