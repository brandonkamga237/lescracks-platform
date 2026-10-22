package com.brandonkamga.lescracks.recognition.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * An attestation. People and events are kept as ids (account and event own them); the name, the
 * wording and the event date are copied in so the document reads the same forever.
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    private Long id;

    /** What anyone types or scans to check the attestation. */
    private String code;

    private Long userId;
    private Long eventId;
    private CertificateKind kind;
    private String holderName;

    /** What the holder did, read after their name: « a participé au hackathon « … » ». */
    private String title;

    /** A second line: the project, the place. */
    private String detail;

    private Instant eventDate;

    @Builder.Default
    private CertificateStatus status = CertificateStatus.DRAFT;

    private Instant issuedAt;

    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isDraft() {
        return status == CertificateStatus.DRAFT;
    }

    /** The name as it stands at issue time is the one the document keeps. */
    public void issue(String currentName, Instant now) {
        holderName = currentName;
        status = CertificateStatus.ISSUED;
        issuedAt = now;
    }

    public void revoke() {
        if (status != CertificateStatus.ISSUED) throw new BadRequestException("Seule une attestation émise peut être révoquée.");
        status = CertificateStatus.REVOKED;
    }

    public void checkDiscardable() {
        if (!isDraft()) throw new BadRequestException("Une attestation émise se révoque, elle ne se supprime pas.");
    }
}
