package com.brandonkamga.lescracks.recognition.domain;

/** An attestation with its holder's current email, for the admin list. */
public record CertificateView(Certificate certificate, String email) {
}
