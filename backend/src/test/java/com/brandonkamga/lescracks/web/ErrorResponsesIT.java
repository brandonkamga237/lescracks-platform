package com.brandonkamga.lescracks.web;

import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.support.Tokens;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * What a failure actually looks like on the wire.
 *
 * The frontend branches on `code` and shows `message`, so both are a contract: a handler
 * that answers 500 with a stack trace, or French copy where a code belongs, breaks the
 * client without breaking a single service test.
 */
@AutoConfigureMockMvc
class ErrorResponsesIT extends PostgresIT {

    @Autowired
    MockMvc mvc;

    @Test
    @DisplayName("an unknown resource answers 404 with a code and a readable sentence")
    void unknownResourceIsNotFound() throws Exception {
        mvc.perform(get("/api/resources/nexiste-pas"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/resources/nexiste-pas"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    @DisplayName("a route that does not exist answers 404 to someone who could have used it")
    void unknownRouteIsNotFound() throws Exception {
        mvc.perform(get("/api/nimportequoi").with(Tokens.admin()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("to an anonymous caller it answers 401, revealing nothing about what exists")
    void unknownRouteRevealsNothingToStrangers() throws Exception {
        mvc.perform(get("/api/nimportequoi"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("an invalid body answers 400 and names the fields at fault")
    void invalidBodyListsTheFields() throws Exception {
        mvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"target\":\"MENTORSHIP\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fields").isMap())
                .andExpect(jsonPath("$.fields").isNotEmpty());
    }

    @Test
    @DisplayName("malformed json answers 400 rather than a parser stack trace")
    void malformedJsonIsARequestProblem() throws Exception {
        mvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ pas du json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));
    }

    @Test
    @DisplayName("no token answers 401 with a code the client can branch on")
    void missingTokenIsUnauthenticated() throws Exception {
        mvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("the wrong role answers 403, distinct from not being signed in")
    void wrongRoleIsForbidden() throws Exception {
        mvc.perform(get("/api/events/admin").with(Tokens.user()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("the wrong verb answers 405, not 404")
    void wrongMethodIsNotAllowed() throws Exception {
        // With a token: security runs before routing, so an anonymous PUT is a 401 and would
        // never reach the dispatcher that decides the verb is wrong.
        mvc.perform(put("/api/resources").with(Tokens.admin()))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("no error response ever leaks a stack trace or a class name")
    void neverLeaksInternals() throws Exception {
        String body = mvc.perform(get("/api/resources/nexiste-pas"))
                .andReturn().getResponse().getContentAsString();

        org.assertj.core.api.Assertions.assertThat(body)
                .doesNotContain("com.brandonkamga", "Exception", "at java.", "SQL");
    }

    @Test
    @DisplayName("a business refusal carries no reference: the caller can fix it themselves")
    void businessRefusalsCarryNoReference() throws Exception {
        mvc.perform(get("/api/resources/nexiste-pas"))
                .andExpect(jsonPath("$.reference").doesNotExist());
    }
}
