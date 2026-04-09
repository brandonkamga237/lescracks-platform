package com.brandonkamga.lescracks.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenSourceProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String repoUrl;
    private String language;
    private String logoUrl;
    private String techStack;
    private int stars;
    private int forks;
    private boolean featured;
    private int featuredOrder;
    private boolean visible;
}
