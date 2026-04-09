package com.brandonkamga.lescracks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenSourceProjectRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String description;
    private String repoUrl;
    private String language;
    private String logoUrl;
    private String techStack;
    @Builder.Default
    private int stars = 0;
    @Builder.Default
    private int forks = 0;
    @Builder.Default
    private boolean featured = false;
    @Builder.Default
    private int featuredOrder = 0;
    @Builder.Default
    private boolean visible = true;
}
