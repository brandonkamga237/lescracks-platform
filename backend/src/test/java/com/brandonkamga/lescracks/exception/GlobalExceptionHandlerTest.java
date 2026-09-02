package com.brandonkamga.lescracks.exception;

import com.brandonkamga.lescracks.dto.common.ApiError;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * What every failure turns into on the wire.
 *
 * Driven directly rather than through MockMvc: these are plain methods, and the thing worth
 * pinning down is the mapping — status, code, and whether a reference is attached — not the
 * servlet stack around it.
 *
 * The distinction that matters throughout: a caller who can fix the problem gets a sentence
 * saying how, and a caller who cannot gets a reference that points at the log line.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private static MockHttpServletRequest request(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRequestURI(uri);
        return request;
    }

    private static MockHttpServletRequest post() {
        return request("POST", "/api/applications");
    }

    @Test
    @DisplayName("a not-found refusal keeps its own status and code")
    void mapsNotFound() {
        ResponseEntity<ApiError> response =
                handler.handleApp(new NotFoundException("Event", "slug", "absent"), post());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.NOT_FOUND);
        assertThat(response.getBody().path()).isEqualTo("/api/applications");
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    @DisplayName("a bad request keeps the sentence the service wrote")
    void mapsBadRequestAndKeepsItsMessage() {
        ResponseEntity<ApiError> response =
                handler.handleApp(new BadRequestException("Les candidatures sont fermées."), post());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.BAD_REQUEST);
        assertThat(response.getBody().message()).isEqualTo("Les candidatures sont fermées.");
    }

    @Test
    @DisplayName("a conflict and a forbidden each keep their own status")
    void mapsConflictAndForbidden() {
        assertThat(handler.handleApp(new ConflictException("Doublon."), post()).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(handler.handleApp(new ForbiddenException("Non."), post()).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("a business refusal carries no reference: there is no log line to look up")
    void businessRefusalsCarryNoReference() {
        assertThat(handler.handleApp(new BadRequestException("Non."), post()).getBody().reference())
                .isNull();
    }

    @Test
    @DisplayName("validation names every field, and the first message doubles as the sentence")
    void validationListsEveryField() throws Exception {
        ResponseEntity<ApiError> response = handler.handleValidation(validationFailure(
                new FieldError("draft", "email", "Votre email est obligatoire."),
                new FieldError("draft", "fullName", "Votre nom est obligatoire.")), post());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.VALIDATION_FAILED);
        assertThat(response.getBody().fields())
                .containsEntry("email", "Votre email est obligatoire.")
                .containsEntry("fullName", "Votre nom est obligatoire.");
        assertThat(response.getBody().message()).isEqualTo("Votre email est obligatoire.");
    }

    @Test
    @DisplayName("two failures on one field report the first, not a random one")
    void keepsTheFirstMessagePerField() throws Exception {
        ResponseEntity<ApiError> response = handler.handleValidation(validationFailure(
                new FieldError("draft", "email", "Votre email est obligatoire."),
                new FieldError("draft", "email", "Format invalide.")), post());

        assertThat(response.getBody().fields()).containsExactly(
                java.util.Map.entry("email", "Votre email est obligatoire."));
    }

    @Test
    @DisplayName("a constraint violation is a 409 the caller can act on, never a 500")
    void databaseConflictIsAConflict() {
        ResponseEntity<ApiError> response = handler.handleDataIntegrity(
                new DataIntegrityViolationException("duplicate key value violates unique constraint"),
                post());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.DATA_CONFLICT);
        assertThat(response.getBody().reference()).isNotBlank();
    }

    @Test
    @DisplayName("a conflict never repeats the SQL back to the caller")
    void databaseConflictHidesTheConstraint() {
        ApiError error = handler.handleDataIntegrity(
                new DataIntegrityViolationException("violates unique constraint \"users_email_key\""),
                post()).getBody();

        assertThat(error.message())
                .doesNotContain("users_email_key", "constraint", "SQL")
                .contains("doublon");
    }

    @Test
    @DisplayName("an oversized upload is 413, not a generic failure")
    void oversizedUploadIsTooLarge() {
        ResponseEntity<ApiError> response = handler.handleTooLarge(
                new MaxUploadSizeExceededException(25_000_000L), request("POST", "/api/media"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.PAYLOAD_TOO_LARGE);
    }

    @Test
    @DisplayName("unreadable json is the caller's problem, so 400")
    void malformedBodyIsABadRequest() {
        ResponseEntity<ApiError> response = handler.handleUnreadable(
                new HttpMessageNotReadableException("Unexpected character", (org.springframework.http.HttpInputMessage) null),
                post());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.MALFORMED_REQUEST);
    }

    @Test
    @DisplayName("403 and 401 are distinct answers to distinct problems")
    void separatesForbiddenFromUnauthenticated() {
        ResponseEntity<ApiError> denied =
                handler.handleAccessDenied(new AccessDeniedException("nope"), post());
        ResponseEntity<ApiError> anonymous =
                handler.handleUnauthenticated(new StubAuthenticationException(), post());

        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().code()).isEqualTo(ErrorCode.FORBIDDEN);
        assertThat(anonymous.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(anonymous.getBody().code()).isEqualTo(ErrorCode.UNAUTHENTICATED);
    }

    @Test
    @DisplayName("an unknown path is a 404, not an internal fault")
    void unknownPathIsNotFound() {
        ResponseEntity<ApiError> response = handler.handleNoRoute(
                new NoResourceFoundException(org.springframework.http.HttpMethod.GET, "/api/absent"),
                request("GET", "/api/absent"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("the wrong verb is 405 and says which verb was refused")
    void wrongMethodNamesTheVerb() {
        ResponseEntity<ApiError> response = handler.handleWrongMethod(
                new HttpRequestMethodNotSupportedException("PUT"), request("PUT", "/api/resources"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(response.getBody().message()).contains("PUT");
    }

    @Test
    @DisplayName("an unexpected fault hands back a reference the caller can quote")
    void unexpectedFaultCarriesAReference() {
        ResponseEntity<ApiError> response =
                handler.handleUnexpected(new IllegalStateException("boom"), post());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().code()).isEqualTo(ErrorCode.INTERNAL_ERROR);
        assertThat(response.getBody().reference()).hasSize(6);
        assertThat(response.getBody().message()).contains(response.getBody().reference());
    }

    @Test
    @DisplayName("an unexpected fault never repeats the internal message")
    void unexpectedFaultHidesTheCause() {
        ApiError error = handler.handleUnexpected(
                new IllegalStateException("could not execute statement [insert into users]"), post()).getBody();

        assertThat(error.message()).doesNotContain("statement", "insert into", "IllegalState");
    }

    @Test
    @DisplayName("two faults get two references, so two reports do not point at one line")
    void referencesAreNotReused() {
        String first = handler.handleUnexpected(new RuntimeException("a"), post()).getBody().reference();
        String second = handler.handleUnexpected(new RuntimeException("b"), post()).getBody().reference();

        assertThat(first).isNotEqualTo(second);
    }

    /** Builds the exception Spring raises on a rejected body, without a controller to raise it. */
    private static MethodArgumentNotValidException validationFailure(FieldError... errors) throws Exception {
        BindingResult binding = new BeanPropertyBindingResult(new Object(), "draft");
        List.of(errors).forEach(binding::addError);
        Method any = GlobalExceptionHandlerTest.class.getDeclaredMethod("placeholder", String.class);
        return new MethodArgumentNotValidException(new org.springframework.core.MethodParameter(any, 0), binding);
    }

    @SuppressWarnings("unused")
    private void placeholder(String body) {
    }

    private static class StubAuthenticationException extends AuthenticationException {
        StubAuthenticationException() {
            super("no token");
        }
    }
}
