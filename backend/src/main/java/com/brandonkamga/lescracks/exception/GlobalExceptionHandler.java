package com.brandonkamga.lescracks.exception;

import com.brandonkamga.lescracks.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(OAuthProviderConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleOAuthProviderConflict(
            OAuthProviderConflictException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage(), request.getRequestURI(), ErrorCode.CONFLICT));
    }

    /**
     * An unknown path reaches the static-resource handler, which throws rather than
     * returning a 404, so a typo in a url looked like a server fault.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(
            NoResourceFoundException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Ressource introuvable.", request.getRequestURI(), ErrorCode.NOT_FOUND));
    }

    /**
     * Without this, a call to the wrong verb surfaced as a 500 "unexpected error", which
     * hides a plain routing mistake behind a message suggesting the server broke.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error("Méthode " + ex.getMethod() + " non supportée pour cette ressource.",
                        request.getRequestURI(), ErrorCode.METHOD_NOT_ALLOWED));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), request.getRequestURI(), ErrorCode.NOT_FOUND));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(
            BadRequestException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), request.getRequestURI(), ErrorCode.BAD_REQUEST));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        // Surface a real, user-facing message (the first field error) instead of a
        // generic "Validation failed" so the frontend can display something meaningful.
        String topMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Certains champs sont invalides.");

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message(topMessage)
                .data(errors)
                .path(request.getRequestURI())
                .errorCode(ErrorCode.VALIDATION_FAILED.name())
                .timestamp(java.time.LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbiddenException(
            ForbiddenException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(), request.getRequestURI(), ErrorCode.FORBIDDEN));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), request.getRequestURI(), ErrorCode.BAD_REQUEST));
    }

    /**
     * A database rule refused the write. The caller can act on this — rename the duplicate,
     * detach what still points at the row — so it is a 409 with a usable sentence, not a 500.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        String reference = newReference();
        log.warn("[{}] Data integrity violation on {}: {}", reference, request.getRequestURI(),
                ex.getMostSpecificCause().getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(
                        "Cette opération entre en conflit avec des données existantes. "
                                + "Vérifiez qu'il ne s'agit pas d'un doublon, ou que l'élément n'est plus utilisé ailleurs.",
                        request.getRequestURI(), ErrorCode.DATA_CONFLICT, reference));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleUploadTooLarge(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error(
                        "Le fichier dépasse la taille maximale autorisée.",
                        request.getRequestURI(), ErrorCode.PAYLOAD_TOO_LARGE));
    }

    /** The body could not be parsed at all — malformed JSON, or a type the field cannot hold. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableBody(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        "La requête est mal formée et n'a pas pu être lue.",
                        request.getRequestURI(), ErrorCode.MALFORMED_REQUEST));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(
                        "Vous n'avez pas les droits nécessaires pour cette action.",
                        request.getRequestURI(), ErrorCode.FORBIDDEN));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthenticated(
            AuthenticationException ex, HttpServletRequest request) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(
                        "Votre session a expiré. Reconnectez-vous pour continuer.",
                        request.getRequestURI(), ErrorCode.UNAUTHENTICATED));
    }

    /**
     * Whatever is left is a fault the user cannot do anything about. They get a reference
     * rather than an apology: it is printed next to the stack trace, so a bug report that
     * quotes it points straight at the log line.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(
            Exception ex, HttpServletRequest request) {
        String reference = newReference();
        log.error("[{}] Unhandled exception on {}: {}", reference, request.getRequestURI(),
                ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        "Une erreur est survenue de notre côté. Citez la référence " + reference
                                + " si vous nous signalez le problème.",
                        request.getRequestURI(), ErrorCode.INTERNAL_ERROR, reference));
    }

    /** Short enough to be read out or typed into a message, long enough not to collide in a day. */
    private static String newReference() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
    }
}
