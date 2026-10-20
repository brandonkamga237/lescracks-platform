package com.brandonkamga.lescracks.recognition.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * An attestation. People and events are kept as ids (identity and event own them); the name, the
 * wording and the event date are copied in so the document reads the same forever.
 */
@Entity
@Table(name = "certificates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** What anyone types or scans to check the attestation. */
    @Column(nullable = false, unique = true, length = 16)
    private String code;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id")
    private Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CertificateKind kind;

    @Column(name = "holder_name", nullable = false, length = 200)
    private String holderName;

    /** What the holder did, read after their name: « a participé au hackathon « … » ». */
    @Column(nullable = false, length = 300)
    private String title;

    /** A second line: the project, the place. */
    @Column(length = 300)
    private String detail;

    @Column(name = "event_date")
    private Instant eventDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CertificateStatus status = CertificateStatus.DRAFT;

    @Column(name = "issued_at")
    private Instant issuedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
