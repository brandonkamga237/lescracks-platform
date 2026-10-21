package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.domain.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.CertificateStatus;
import com.brandonkamga.lescracks.recognition.domain.CertificateView;

import java.time.Instant;

public record AdminCertificateResponse(Long id, String code, CertificateKind kind, CertificateStatus status, String holderName,
                                       String email, String title, String detail, Instant eventDate, Instant issuedAt) {

    public static AdminCertificateResponse of(CertificateView view) {
        var certificate = view.certificate();
        return new AdminCertificateResponse(certificate.getId(), certificate.getCode(), certificate.getKind(), certificate.getStatus(),
                certificate.getHolderName(), view.email(), certificate.getTitle(), certificate.getDetail(), certificate.getEventDate(),
                certificate.getIssuedAt());
    }
}
