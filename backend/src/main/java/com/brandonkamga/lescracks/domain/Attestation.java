package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Proof that a participation was completed, issued once an admin confirms it.
 *
 * The code is the whole point. A certificate only its holder can display is a picture; this
 * one carries a reference anybody can check against the platform, which is what makes it
 * worth putting on a CV.
 *
 * There is at most one per participation, and it is never reissued: the first code may
 * already be printed somewhere.
 */
@Entity
@Table(name = "attestations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attestation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participation_id", nullable = false, unique = true)
    private Participation participation;

    /** What someone types to verify it. Readable on paper, not guessable in sequence. */
    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "issued_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant issuedAt = Instant.now();
}
