package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Something a learner actually built and shipped.
 *
 * This is the load-bearing part of the whole showcase. A testimonial can be written
 * by anyone and a percentage can be invented, but a repository the reader can open
 * and a deployed URL they can click cannot be faked. It is the only claim on the
 * profile that does not require trusting us.
 *
 * A project with neither {@code repoUrl} nor {@code liveUrl} proves nothing and
 * should not be displayed.
 */
@Entity
@Table(name = "learner_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnerProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Public source code — the strongest evidence a tech programme can offer. */
    @Column(name = "repo_url", length = 500)
    private String repoUrl;

    /** A running deployment the reader can click. */
    @Column(name = "live_url", length = 500)
    private String liveUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /** A project nobody can open is not evidence. */
    public boolean isVerifiable() {
        return (repoUrl != null && !repoUrl.isBlank())
            || (liveUrl != null && !liveUrl.isBlank());
    }
}
