package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Requête de création/mise à jour d'événement")
public class EventRequest {

    @Schema(description = "Titre de l'événement", example = "Formation Spring Boot", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "Description de l'événement")
    private String description;

    @Schema(description = "Date (et heure optionnelle) de début", example = "2024-12-01T10:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event date is required")
    private LocalDateTime eventDate;

    @Schema(description = "Date (et heure optionnelle) de fin — optionnelle")
    private LocalDateTime endDate;

    @Schema(description = "Lieu de l'événement")
    private String location;

    @Schema(description = "URL de l'image de couverture")
    private String coverImageUrl;

    @Schema(description = "Indique si une candidature est requise", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Application required flag is required")
    private Boolean applicationRequired;

    @Schema(description = "ID du type d'événement", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event type ID is required")
    private Long eventTypeId;

    @Schema(description = "ID du statut de l'événement", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event status ID is required")
    private Long eventStatusId;

    @Schema(description = "Liste des IDs des tags associés")
    private Set<Long> tagIds;
}
