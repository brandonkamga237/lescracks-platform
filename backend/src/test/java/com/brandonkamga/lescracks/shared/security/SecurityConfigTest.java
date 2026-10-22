package com.brandonkamga.lescracks.shared.security;

import com.brandonkamga.lescracks.event.api.EventController;
import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.engagement.api.ReactionController;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.application.ReactionService;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.shared.util.VisitorKeys;
import com.brandonkamga.lescracks.content.api.ArticleController;
import com.brandonkamga.lescracks.content.application.ArticleAdminService;
import com.brandonkamga.lescracks.content.application.ArticleCatalog;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.account.infra.persistence.JdbcLastSeen;
import com.brandonkamga.lescracks.account.infra.security.LastSeenFilterConfig;
import com.brandonkamga.lescracks.storage.domain.StorageService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Who may call what. The rules are declared in one place, so they are asserted in one place
 * rather than restated in every controller test.
 *
 * The article routes are the probe because they exercise all three cases at once: an open
 * read, the {@code /api/*&#47;admin} matcher, and the {@code @PreAuthorize} behind it. Adding a
 * domain does not need a copy of this class — it needs a line here only if it introduces a
 * *kind* of rule that is not covered yet.
 *
 * No database, so this runs in the fast suite despite booting a Spring slice.
 */
@WebMvcTest({ArticleController.class, EventController.class, ReactionController.class})
@Import({SecurityConfig.class, KeycloakRoleConverter.class, SecurityErrorWriter.class, LastSeenFilterConfig.class})
class SecurityConfigTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ArticleCatalog catalog;
    @MockitoBean private ArticleAdminService articles;
    @MockitoBean private EventService events;
    @MockitoBean private ReactionService reactions;
    @MockitoBean private EngagementCounts engagement;
    @MockitoBean private StorageService storage;
    // The security chain registers the last-seen touch, which needs the database.
    @MockitoBean private JdbcLastSeen lastSeen;

    @Test
    @DisplayName("reading the catalogue needs no account: that is what brings people in")
    void catalogueIsOpenToAnonymous() throws Exception {
        when(catalog.search(any(), any(), any(), any())).thenReturn(new Paged<>(List.of(), 0, 12, 0));

        mockMvc.perform(get("/api/resources")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("an anonymous call to an admin route is 401 with a readable body, not an empty 403")
    void adminRouteRejectsAnonymous() throws Exception {
        mockMvc.perform(get("/api/resources/admin"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("a logged-in member is not an admin")
    void adminRouteRejectsAPlainMember() throws Exception {
        mockMvc.perform(get("/api/resources/admin"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminRouteAcceptsAnAdmin() throws Exception {
        when(articles.list(any(), any())).thenReturn(new Paged<>(List.of(), 0, 20, 0));

        mockMvc.perform(get("/api/resources/admin")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("a write is refused before it reaches the service")
    void deleteRejectsAnonymous() throws Exception {
        mockMvc.perform(delete("/api/resources/admin/1")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("the one open write: an anonymous visitor may be counted on an event page")
    void eventViewIsOpenToAnonymous() throws Exception {
        UUID browser = UUID.randomUUID();
        when(reactions.recordView(eq(Target.event(1L)), eq(VisitorKeys.anonymous(browser)))).thenReturn(1);

        mockMvc.perform(post("/api/events/1/views").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"visitorId\":\"" + browser + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewCount").value(1));
    }
}
