package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.member.application.Member;

/** A registration with the member it belongs to, for the admin list. */
public record RegistrationView(Registration registration, Member member) {
}
