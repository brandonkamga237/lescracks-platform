package com.brandonkamga.lescracks.recognition.infra.event;

import com.brandonkamga.lescracks.recognition.application.BadgeRules;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Runs in the issuing transaction, so an attestation and the badge it earns go together. */
@Component
public class CertificateIssuedListener {

    private final BadgeRules rules;

    public CertificateIssuedListener(BadgeRules rules) {
        this.rules = rules;
    }

    @EventListener
    public void awardBadge(CertificateIssued issued) {
        rules.onCertificateIssued(issued);
    }
}
