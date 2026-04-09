package com.brandonkamga.lescracks.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContributorResponse {
    private Long id;
    private String name;
    private String description;
    private String photoUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;
    private String twitterUrl;
    private List<String> contributedProjects;
    private int displayOrder;
    private boolean visible;
}
