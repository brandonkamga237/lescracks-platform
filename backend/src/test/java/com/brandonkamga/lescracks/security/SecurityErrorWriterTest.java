package com.brandonkamga.lescracks.security;

import com.brandonkamga.lescracks.dto.common.ApiError;
import com.brandonkamga.lescracks.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The body a rejected request gets back.
 *
 * This exists because the handlers in GlobalExceptionHandler could never fire for 401 and
 * 403 — Spring Security answers inside the filter chain, before any controller advice — so
 * the client received a bare status and an empty response. What is pinned here is that a
 * rejection looks like every other failure the API produces.
 */
class SecurityErrorWriterTest {

    private final ObjectMapper json = new ObjectMapper()
            .findAndRegisterModules();
    private final SecurityErrorWriter writer = new SecurityErrorWriter(json);

    private static MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/events/admin");
        request.setRequestURI("/api/events/admin");
        return request;
    }

    private ApiError bodyOf(MockHttpServletResponse response) throws Exception {
        return json.readValue(response.getContentAsString(), ApiError.class);
    }

    @Test
    @DisplayName("no token answers 401 with a code the client can branch on")
    void missingTokenIsUnauthenticated() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.commence(request(), response, new StubAuthenticationException());

        assertThat(response.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(bodyOf(response).code()).isEqualTo(ErrorCode.UNAUTHENTICATED);
    }

    @Test
    @DisplayName("the wrong role answers 403, a different code from not being signed in")
    void wrongRoleIsForbidden() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.handle(request(), response, new AccessDeniedException("nope"));

        assertThat(response.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(bodyOf(response).code()).isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("the body is json, so the client parses it like any other error")
    void answersWithJson() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.handle(request(), response, new AccessDeniedException("nope"));

        assertThat(response.getContentType()).startsWith(MediaType.APPLICATION_JSON_VALUE);
        assertThat(response.getContentAsString()).isNotBlank();
    }

    @Test
    @DisplayName("the path is echoed back, so a client knows which call was refused")
    void echoesThePath() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.commence(request(), response, new StubAuthenticationException());

        assertThat(bodyOf(response).path()).isEqualTo("/api/events/admin");
        assertThat(bodyOf(response).timestamp()).isNotNull();
    }

    @Test
    @DisplayName("the message is French, because a person reads it")
    void messageIsForAPerson() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.commence(request(), response, new StubAuthenticationException());

        assertThat(bodyOf(response).message()).contains("connecté");
    }

    @Test
    @DisplayName("accented French survives the encoding")
    void writesUtf8() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.handle(request(), response, new AccessDeniedException("nope"));

        // A mojibake message is worse than none: it reaches the user's screen.
        assertThat(bodyOf(response).message()).contains("nécessaires");
    }

    @Test
    @DisplayName("a rejection never says which route exists or why it was refused internally")
    void leaksNothing() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        writer.handle(request(), response, new AccessDeniedException("Access is denied for ROLE_ADMIN"));

        assertThat(response.getContentAsString())
                .doesNotContain("ROLE_ADMIN", "AccessDenied", "com.brandonkamga");
    }

    private static class StubAuthenticationException extends AuthenticationException {
        StubAuthenticationException() {
            super("no token");
        }
    }
}
