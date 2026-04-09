package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "open_source_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenSourceProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String repoUrl;
    private String language;
    private String logoUrl;

    /** e.g. "Python", "React", "Java" — displayed as colored badge */
    private String techStack;

    @Builder.Default
    private int stars = 0;

    @Builder.Default
    private int forks = 0;

    /** Whether this project appears on the homepage / open-source page */
    @Builder.Default
    private boolean featured = false;

    /** Order among featured projects */
    @Builder.Default
    private int featuredOrder = 0;

    @Builder.Default
    private boolean visible = true;
}
