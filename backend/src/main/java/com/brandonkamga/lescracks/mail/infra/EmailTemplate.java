package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.Email;

/** Turns one kind of email into what is sent. One Spring bean per kind, found by {@link #type()}. */
public interface EmailTemplate<T extends Email> {

    Class<T> type();

    RenderedEmail render(T email);
}
