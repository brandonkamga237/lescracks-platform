package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * The Accompagnement 360.
 *
 * One thing, permanently, and nothing like an event: no date, no venue, no seats. Its whole
 * state is whether it is open — when it is, people may apply; when it is not, they may not.
 *
 * A single row, which the primary key enforces rather than convention: the database refuses
 * any id but 1.
 */
@Entity
@Table(name = "mentorship")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Mentorship {

    /** Always 1. There is one Accompagnement 360 and there will not be a second row. */
    public static final short SINGLETON_ID = 1;

    @Id
    @Builder.Default
    private Short id = SINGLETON_ID;

    /** Whether applications are being taken right now. Admins flip this; nothing else does. */
    @Column(nullable = false)
    @Builder.Default
    private boolean open = false;

    @Column(nullable = false, length = 200)
    @Builder.Default
    private String title = "Accompagnement 360";

    @Column(length = 500)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_id")
    private Media cover;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
