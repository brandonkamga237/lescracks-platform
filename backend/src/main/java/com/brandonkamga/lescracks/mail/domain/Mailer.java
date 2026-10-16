package com.brandonkamga.lescracks.mail.domain;

public interface Mailer {

    void send(Email email);

    /** The HTML the recipient would see, for previews in the back office. */
    String previewHtml(Email email);
}
