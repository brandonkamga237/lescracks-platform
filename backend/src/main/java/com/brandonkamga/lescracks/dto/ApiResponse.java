package com.brandonkamga.lescracks.dto;

import com.brandonkamga.lescracks.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Réponse standard de l'API")
public class ApiResponse<T> {

    @Schema(description = "Indique si la requête a réussi", example = "true")
    private boolean success;

    @Schema(description = "Message de retour")
    private String message;

    @Schema(description = "Données de la réponse")
    private T data;

    @Schema(description = "Horodatage de la réponse")
    private LocalDateTime timestamp;

    @Schema(description = "Chemin de la requête")
    private String path;

    @Schema(description = "Identifiant stable de l'erreur. Contrairement au message, il ne change pas : "
            + "c'est sur lui qu'un client doit brancher son comportement.", example = "NOT_FOUND")
    private String errorCode;

    @Schema(description = "Référence à citer dans un signalement. Elle apparaît telle quelle dans les "
            + "logs serveur, ce qui permet de retrouver la trace exacte.", example = "A3F91C")
    private String reference;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String path) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String path, ErrorCode code) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .path(path)
                .errorCode(code.name())
                .timestamp(LocalDateTime.now())
                .build();
    }

    /** Used for failures the user cannot act on, where the reference is what makes a report useful. */
    public static <T> ApiResponse<T> error(String message, String path, ErrorCode code, String reference) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .path(path)
                .errorCode(code.name())
                .reference(reference)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
