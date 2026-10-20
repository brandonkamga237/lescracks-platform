package com.brandonkamga.lescracks.recognition.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A badge held by a member, with why and since when. */
@Entity
@Table(name = "member_badges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 300)
    private String reason;

    @Column(name = "awarded_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant awardedAt = Instant.now();
}
