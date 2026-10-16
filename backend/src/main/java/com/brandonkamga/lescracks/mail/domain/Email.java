package com.brandonkamga.lescracks.mail.domain;

/**
 * One kind of email, as the data it needs. Each implementation has its own template in
 * mail/infra; adding an email means adding a record and a template, nothing else changes.
 */
public interface Email {

    String to();
}
