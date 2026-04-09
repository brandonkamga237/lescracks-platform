package com.brandonkamga.lescracks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContributorRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String description;
    private String photoUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String websiteUrl;
    private String twitterUrl;
    private List<String> contributedProjects;
    @Builder.Default
    private int displayOrder = 0;
    @Builder.Default
    private boolean visible = true;
}
