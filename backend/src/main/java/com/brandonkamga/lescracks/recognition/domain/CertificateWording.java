package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventType;

/**
 * The sentence an attestation reads after the holder's name, by event type and kind:
 * « a participé à l’atelier « Docker en pratique » », « a remporté le hackathon « … » ».
 */
public final class CertificateWording {

    private CertificateWording() {
    }

    public static String of(CertificateKind kind, Event event, Integer rank) {
        String named = "« " + event.getTitle() + " »";
        return switch (kind) {
            case PARTICIPATION -> "a participé " + at(event.getType()) + " " + named;
            case WINNER -> "a remporté " + the(event.getType()) + " " + named;
            case PODIUM -> "s’est classé" + (rank != null && rank > 1 ? " " + rank + "e" : "") + " " + at(event.getType()) + " " + named;
            case AMBASSADOR -> "a fait connaître LesCracks en ambassadeur";
        };
    }

    private static String at(EventType type) {
        return switch (type) {
            case HACKATHON -> "au hackathon";
            case WORKSHOP -> "à l’atelier";
            case BOOTCAMP -> "au bootcamp";
            case WEBINAR -> "au webinaire";
            case CONFERENCE -> "à la conférence";
        };
    }

    private static String the(EventType type) {
        return switch (type) {
            case HACKATHON -> "le hackathon";
            case WORKSHOP -> "l’atelier";
            case BOOTCAMP -> "le bootcamp";
            case WEBINAR -> "le webinaire";
            case CONFERENCE -> "la conférence";
        };
    }
}
