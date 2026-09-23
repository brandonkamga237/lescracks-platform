package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceMapper;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.infra.EbookRepository;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.storage.domain.StorageService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The HTTP edge of the resource domain: status codes, payload shape, parameter binding and the
 * translation of a domain exception into an {@code ApiError}.
 *
 * Filters are off on purpose. Who may call which route is a property of SecurityConfig and is
 * asserted once, in shared/security, instead of being re-stated in every controller test.
 */
@WebMvcTest(ResourceController.class)
@AutoConfigureMockMvc(addFilters = false)
class ResourceControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ResourceService resources;
    @MockitoBean private ResourceMapper mapper;
    @MockitoBean private EbookRepository ebooks;
    @MockitoBean private StorageService storage;

    private static ResourceResponse response() {
        return new ResourceResponse(1L, "spring-boot", "Spring Boot", "Description",
                "https://cdn.example/cover.png", ResourceStatus.PUBLISHED, 2L, "Backend",
                "EXTERNAL_VIDEO", "https://youtu.be/abc", "YouTube", null, null, null,
                Set.of("Java"), 3L, Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z"), null, null);
    }

    @Test
    @DisplayName("the listing exposes a pager, not Spring's internal Page")
    void listsPublishedResources() throws Exception {
        var page = new PageImpl<>(List.of(new Resource()), PageRequest.of(0, 12), 1);
        when(resources.search(eq(ResourceStatus.PUBLISHED), any(), any(), any(), any(), any()))
                .thenReturn(page);
        when(mapper.toResponse(any(Resource.class))).thenReturn(response());

        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("spring-boot"))
                .andExpect(jsonPath("$.content[0].likeCount").value(3))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.sort").doesNotExist());
    }

    @Test
    @DisplayName("an unknown slug answers 404 with the NOT_FOUND code, not a 500")
    void translatesNotFound() throws Exception {
        when(resources.requirePublishedBySlugOrId("absent"))
                .thenThrow(new NotFoundException("Resource", "slug", "absent"));

        mockMvc.perform(get("/api/resources/absent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.path").value("/api/resources/absent"));
    }

    @Test
    @DisplayName("a query parameter that cannot convert is the caller's mistake: 400, no stack trace")
    void rejectsAnUnconvertibleParameter() throws Exception {
        mockMvc.perform(get("/api/resources").param("categoryId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("categoryId")));
    }

    @Test
    @DisplayName("validation refuses an empty title before the service is ever called")
    void validatesTheVideoPayload() throws Exception {
        var data = new MockMultipartFile("data", "data.json", MediaType.APPLICATION_JSON_VALUE, """
                {"title": "  ", "description": "Une description", "categoryId": 1,
                 "videoUrl": "https://youtu.be/abc", "platform": "YouTube"}
                """.getBytes());

        mockMvc.perform(multipart("/api/resources/admin/videos").file(data))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fields.title").exists());
    }
}
