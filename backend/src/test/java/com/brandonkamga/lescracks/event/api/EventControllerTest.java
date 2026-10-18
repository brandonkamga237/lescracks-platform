package com.brandonkamga.lescracks.event.api;

import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.event.domain.EventVisitor;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The view counter's HTTP edge. Who may call it is SecurityConfig's business, asserted elsewhere. */
@WebMvcTest(EventController.class)
@AutoConfigureMockMvc(addFilters = false)
class EventControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private EventService events;

    @Test
    @DisplayName("an anonymous browser is counted by the id it sends")
    void countsAnAnonymousBrowser() throws Exception {
        UUID browser = UUID.randomUUID();
        when(events.recordView(eq(9L), eq(EventVisitor.anonymous(browser)))).thenReturn(12);

        mockMvc.perform(post("/api/events/9/views").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"visitorId\":\"" + browser + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewCount").value(12));
    }

    @Test
    @DisplayName("without a session or a browser id there is nobody to count: 400")
    void refusesAnUnidentifiedVisitor() throws Exception {
        mockMvc.perform(post("/api/events/9/views"))
                .andExpect(status().isBadRequest());
        verify(events, never()).recordView(any(), any());
    }
}
