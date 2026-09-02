package com.brandonkamga.lescracks.web;

import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.support.Tokens;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may reach what.
 *
 * The rules live in two places that must agree — the matchers in SecurityConfig and the
 * @PreAuthorize on each admin method — and a mismatch between them is silent: the route
 * simply answers to the wrong people. That already happened here. "admin" is a single path
 * segment, so /api/events/admin matched the permitAll on /api/events/*, and only the
 * annotation was still holding the door.
 */
@AutoConfigureMockMvc
class SecurityRulesIT extends PostgresIT {

    @Autowired
    MockMvc mvc;

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/events", "/api/resources", "/api/categories", "/api/tags",
            "/api/mentorship", "/api/sitemap.xml", "/seo/pages/home", "/actuator/health"})
    @DisplayName("anyone may read what brings people in")
    void publicRoutesAreOpen(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/events/admin", "/api/resources/admin", "/api/applications/admin",
            "/api/participations/admin", "/api/categories/admin", "/api/tags/admin",
            "/api/mentorship/admin"})
    @DisplayName("an anonymous caller is turned away from every admin route")
    void adminRoutesRejectAnonymous(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/events/admin", "/api/resources/admin", "/api/applications/admin",
            "/api/participations/admin", "/api/categories/admin", "/api/tags/admin",
            "/api/mentorship/admin"})
    @DisplayName("a signed-in member is not an administrator")
    void adminRoutesRejectPlainUsers(String path) throws Exception {
        mvc.perform(get(path).with(Tokens.user())).andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/events/admin", "/api/resources/admin", "/api/applications/admin",
            "/api/participations/admin"})
    @DisplayName("an administrator gets through")
    void adminRoutesAcceptAdmins(String path) throws Exception {
        mvc.perform(get(path).with(Tokens.admin())).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/users/me"})
    @DisplayName("reading your own profile requires being someone")
    void personalRoutesNeedAnAccount(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/events/admin", "/api/resources/admin"})
    @DisplayName("a token nobody signed is worth nothing")
    void rejectsAnUnsignedToken(String path) throws Exception {
        mvc.perform(get(path).header("Authorization", "Bearer not.a.token"))
                .andExpect(status().isUnauthorized());
    }
}
