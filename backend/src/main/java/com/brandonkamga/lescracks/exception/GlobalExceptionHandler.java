package com.brandonkamga.lescracks.exception;

import com.brandonkamga.lescracks.dto.common.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Turns anything thrown into an answer, and decides what reaches the log.
 *
 * One line per failure, at the level that matches who can act on it. A refused business rule
 * is a WARN with no stack trace: that is the system working, and a trace would bury the
 * failures that are not. Anything unhandled is an ERROR with the trace and a reference,
 * because somebody has to go and read it.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Everything the application refuses on purpose, translated rather than re-decided. */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiError> handleApp(AppException ex, HttpServletRequest request) {
        log.warn("{} on {} {}: {}", ex.code(), request.getMethod(), path(request), ex.getMessage());
        return ResponseEntity.status(ex.status())
                .body(ApiError.of(ex.code(), ex.getMessage(), path(request)));
    }

    /**
     * Field validation. The first message doubles as the sentence, so a client with no
     * per-field display still says something useful; the map is there for one that has.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex,
                                                     HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));

        String first = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Certains champs sont invalides.");

        log.warn("VALIDATION_FAILED on {} {}: {}", request.getMethod(), path(request), fields);
        return ResponseEntity.badRequest().body(ApiError.fields(first, path(request), fields));
    }

    /**
     * A database rule refused the write. The caller can act on it — rename the duplicate,
     * detach what still points at the row — so it is a 409 with a usable sentence, not a 500.
     * The cause is logged because which constraint fired is the whole diagnosis.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex,
                                                        HttpServletRequest request) {
        String reference = newReference();
        log.warn("[{}] DATA_CONFLICT on {} {}: {}", reference, request.getMethod(), path(request),
                ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.referenced(
                ErrorCode.DATA_CONFLICT,
                "Cette opération entre en conflit avec des données existantes. "
                        + "Vérifiez qu'il ne s'agit pas d'un doublon, ou que l'élément n'est plus utilisé ailleurs.",
                path(request), reference));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleTooLarge(MaxUploadSizeExceededException ex,
                                                   HttpServletRequest request) {
        log.warn("PAYLOAD_TOO_LARGE on {}", path(request));
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(ApiError.of(
                ErrorCode.PAYLOAD_TOO_LARGE,
                "Le fichier dépasse la taille maximale autorisée.", path(request)));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex,
                                                     HttpServletRequest request) {
        log.warn("MALFORMED_REQUEST on {} {}: {}", request.getMethod(), path(request),
                ex.getMostSpecificCause().getMessage());
        return ResponseEntity.badRequest().body(ApiError.of(
                ErrorCode.MALFORMED_REQUEST,
                "La requête est mal formée et n'a pas pu être lue.", path(request)));
    }

    /**
     * A query parameter that will not convert — ?kind=PODCAST, ?categoryId=abc. Reachable by
     * anyone typing a url, so it must be a 400: as an unhandled fault it answered 500 and put
     * a stack trace in the log for every mistyped link.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleBadParameter(MethodArgumentTypeMismatchException ex,
                                                       HttpServletRequest request) {
        log.warn("BAD_REQUEST on {} {}: {}={}", request.getMethod(), path(request),
                ex.getName(), ex.getValue());
        return ResponseEntity.badRequest().body(ApiError.of(
                ErrorCode.BAD_REQUEST,
                "La valeur du paramètre « " + ex.getName() + " » n'est pas valide.", path(request)));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex,
                                                       HttpServletRequest request) {
        log.warn("FORBIDDEN on {} {}", request.getMethod(), path(request));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of(
                ErrorCode.FORBIDDEN,
                "Vous n'avez pas les droits nécessaires pour cette action.", path(request)));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleUnauthenticated(AuthenticationException ex,
                                                          HttpServletRequest request) {
        log.warn("UNAUTHENTICATED on {} {}", request.getMethod(), path(request));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiError.of(
                ErrorCode.UNAUTHENTICATED,
                "Votre session a expiré. Reconnectez-vous pour continuer.", path(request)));
    }

    /** An unknown path reaches the static-resource handler and throws; that is a 404, not a fault. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoRoute(NoResourceFoundException ex,
                                                  HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of(
                ErrorCode.NOT_FOUND, "Ressource introuvable.", path(request)));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleWrongMethod(HttpRequestMethodNotSupportedException ex,
                                                      HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiError.of(
                ErrorCode.METHOD_NOT_ALLOWED,
                "Méthode " + ex.getMethod() + " non supportée pour cette ressource.", path(request)));
    }

    /**
     * Whatever is left is ours, and the caller can do nothing about it. They get a reference
     * rather than an apology: it is printed beside the stack trace, so a report quoting it
     * finds the line without anyone guessing at timestamps.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        String reference = newReference();
        log.error("[{}] INTERNAL_ERROR on {} {}", reference, request.getMethod(), path(request), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiError.referenced(
                ErrorCode.INTERNAL_ERROR,
                "Une erreur est survenue de notre côté. Citez la référence " + reference
                        + " si vous nous signalez le problème.",
                path(request), reference));
    }

    /** Short enough to read aloud or type into a message, unique enough for a day of logs. */
    private static String newReference() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }

    private static String path(HttpServletRequest request) {
        return request.getRequestURI();
    }
}
