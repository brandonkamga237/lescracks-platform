package com.brandonkamga.lescracks.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Réponse contenant les informations d'un événement")
public class EventResponse {

    @Schema(description = "ID unique de l'événement", example = "1")
    private Long id;

    @Schema(description = "Titre de l'événement", example = "Formation Spring Boot")
    private String title;

    @Schema(description = "Description de l'événement")
    private String description;

    @Schema(description = "Date et heure de l'événement")
    private LocalDateTime eventDate;

    @Schema(description = "Indique si une candidature est requise")
    private Boolean applicationRequired;

    @Schema(description = "Date de création")
    private LocalDateTime createdAt;

    @Schema(description = "ID du type d'événement")
    private Long eventTypeId;

    @Schema(description = "Nom du type d'événement")
    private String eventTypeName;

    @Schema(description = "ID du statut de l'événement")
    private Long eventStatusId;

    @Schema(description = "Nom du statut de l'événement")
    private String eventStatusName;

    @Schema(description = "Tags associés à l'événement")
    private Set<TagDto> tags;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Tag associé à un événement")
    public static class TagDto {
        @Schema(description = "ID du tag")
        private Long id;
        @Schema(description = "Nom du tag")
        private String name;
    }
}
