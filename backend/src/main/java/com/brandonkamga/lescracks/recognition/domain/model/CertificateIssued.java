package com.brandonkamga.lescracks.recognition.domain.model;

/** Published when an attestation is issued, so other rules (badges today) react without the issuer knowing them. */
public record CertificateIssued(Long userId, CertificateKind kind, Long eventId) {
}
