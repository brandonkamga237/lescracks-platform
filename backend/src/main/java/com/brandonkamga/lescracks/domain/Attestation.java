package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Proof that a participation was completed, issued once an admin says so.
 *
 * The code is the point: it is what someone else opens to check the claim. A certificate
 * that only its holder can display is a picture, not proof.
 */
@Entity
@Table(name = "attestations")
@Data
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

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "issued_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant issuedAt = Instant.now();
}
