package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.identity.domain.User;

/** A registration with the member it belongs to, for the admin list. */
public record RegistrationView(EventRegistration registration, User member) {
}
