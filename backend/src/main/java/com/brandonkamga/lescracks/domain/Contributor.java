package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "contributors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contributor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String photoUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;
    private String twitterUrl;

    /** Slugs or names of open source projects this contributor worked on */
    @ElementCollection
    @CollectionTable(name = "contributor_projects", joinColumns = @JoinColumn(name = "contributor_id"))
    @Column(name = "project_name")
    private List<String> contributedProjects;

    /** Display order on the page */
    @Builder.Default
    private int displayOrder = 0;

    @Builder.Default
    private boolean visible = true;
}
