package com.brandonkamga.lescracks.recognition.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** A badge a member can hold. System badges come from rules; the admin creates the others. */
@Entity
@Table(name = "badges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Badge {

    public static final String EVENT_PARTICIPANT = "EVENT_PARTICIPANT";
    public static final String HACKATHON_PARTICIPANT = "HACKATHON_PARTICIPANT";
    public static final String HACKATHON_PODIUM = "HACKATHON_PODIUM";
    public static final String HACKATHON_WINNER = "HACKATHON_WINNER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 300)
    private String description;

    /** A key the site turns into an icon (award, trophy, code…), never a file. */
    @Column(nullable = false, length = 40)
    @Builder.Default
    private String icon = "award";

    @Column(nullable = false)
    @Builder.Default
    private boolean system = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
