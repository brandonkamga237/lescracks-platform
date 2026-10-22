package com.brandonkamga.lescracks.resource.api;

import com.brandonkamga.lescracks.resource.domain.Article;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.category;
import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.resource;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResourceMapperTest {

    private final ResourceService resources = mock(ResourceService.class);
    private final EngagementCounts engagement = mock(EngagementCounts.class);
    private final ResourceMapper mapper = new ResourceMapper(resources, engagement);

    private Resource stubbedArticle() throws Exception {
        var theme = category("Backend");
        theme.setId(2L);
        Resource resource = resource(theme, "Spring Boot", ResourceStatus.PUBLISHED);
        resource.setId(1L);
        var body = new ObjectMapper().readTree("[{\"type\":\"paragraph\",\"text\":\"Bonjour\"}]");
        when(resources.article(1L)).thenReturn(Optional.of(Article.builder().body(body).readingMinutes(7).build()));
        when(engagement.countsOf(TargetType.ARTICLE, List.of(1L))).thenReturn(Map.of(1L, new Counts(30, 4)));
        when(engagement.countsOf(Target.article(1L))).thenReturn(new Counts(30, 4));
        return resource;
    }

    @Test
    @DisplayName("a list item keeps what a card shows but leaves the body out")
    void summaryLeavesTheBodyOut() throws Exception {
        Resource article = stubbedArticle();
        var summary = mapper.summaries(List.of(article)).apply(article);

        assertThat(summary.body()).isNull();
        assertThat(summary.readingMinutes()).isEqualTo(7);
        assertThat(summary.likeCount()).isEqualTo(4L);
        assertThat(summary.viewCount()).isEqualTo(30);
    }

    @Test
    @DisplayName("the article page still gets its body")
    void fullResponseCarriesTheBody() throws Exception {
        assertThat(mapper.toResponse(stubbedArticle()).body()).isNotNull();
    }
}
