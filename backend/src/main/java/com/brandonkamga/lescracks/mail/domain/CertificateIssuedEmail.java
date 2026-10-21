package com.brandonkamga.lescracks.mail.domain;

/** Sent when the admin issues an attestation: what it recognises and the code that opens it. */
public record CertificateIssuedEmail(String to, String firstName, String title, String code) implements Email {
}
