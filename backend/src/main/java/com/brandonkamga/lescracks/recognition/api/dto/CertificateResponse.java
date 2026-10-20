package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.domain.Certificate;
import com.brandonkamga.lescracks.recognition.domain.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.CertificateStatus;

import java.time.Instant;

/** An attestation as anyone checking it sees it: no email, no internal ids beyond the event. */
public record CertificateResponse(String code, CertificateKind kind, String holderName, String title, String detail,
                                  Long eventId, Instant eventDate, Instant issuedAt, boolean revoked) {

    public static CertificateResponse of(Certificate certificate) {
        return new CertificateResponse(certificate.getCode(), certificate.getKind(), certificate.getHolderName(), certificate.getTitle(),
                certificate.getDetail(), certificate.getEventId(), certificate.getEventDate(), certificate.getIssuedAt(),
                certificate.getStatus() == CertificateStatus.REVOKED);
    }
}
