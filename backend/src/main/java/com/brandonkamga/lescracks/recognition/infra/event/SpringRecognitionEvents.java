package com.brandonkamga.lescracks.recognition.infra.event;

import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;
import com.brandonkamga.lescracks.recognition.domain.port.RecognitionEvents;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** Hands recognition's events to Spring, where listeners react without the issuer knowing them. */
@Component
public class SpringRecognitionEvents implements RecognitionEvents {

    private final ApplicationEventPublisher publisher;

    public SpringRecognitionEvents(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void issued(CertificateIssued event) {
        publisher.publishEvent(event);
    }
}
