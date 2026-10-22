package com.brandonkamga.lescracks.recognition.domain.port;

import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;

/** What recognition tells the rest of the platform; who listens is not its concern. */
public interface RecognitionEvents {

    void issued(CertificateIssued event);
}
