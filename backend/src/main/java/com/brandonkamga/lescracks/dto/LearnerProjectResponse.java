package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Projet livré par un apprenant — la preuve vérifiable du parcours")
public class LearnerProjectResponse {

    private Long id;

    @Schema(description = "Titre du projet", example = "API de gestion de stock")
    private String title;

    private String description;

    @Schema(description = "Code source public", example = "https://github.com/…")
    private String repoUrl;

    @Schema(description = "Déploiement en ligne", example = "https://…")
    private String liveUrl;

    private String imageUrl;

    private int displayOrder;

    /** False when the project has neither repo nor live URL — nothing to verify. */
    @Schema(description = "Le lecteur peut-il vérifier ce projet lui-même ?")
    private boolean verifiable;
}
