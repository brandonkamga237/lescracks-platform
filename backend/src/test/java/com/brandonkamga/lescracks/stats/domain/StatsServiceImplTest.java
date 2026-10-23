package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.account.application.AccountStatistics;
import com.brandonkamga.lescracks.content.application.ContentStatistics;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.event.application.EventStatistics;
import com.brandonkamga.lescracks.member.application.MemberStatistics;
import com.brandonkamga.lescracks.newsletter.application.NewsletterStatistics;
import com.brandonkamga.lescracks.stats.api.dto.NamedCount;
import com.brandonkamga.lescracks.stats.infra.UmamiClient;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StatsServiceImplTest {

    private final AccountStatistics accounts = mock(AccountStatistics.class);
    private final MemberStatistics members = mock(MemberStatistics.class);
    private final TaxonomyService taxonomy = mock(TaxonomyService.class);
    private final EngagementCounts engagement = mock(EngagementCounts.class);
    private final EventStatistics events = mock(EventStatistics.class);
    private final StatsServiceImpl stats = withUmami(mock(UmamiClient.class));

    @Test
    @DisplayName("the portrait names each interest, puts the fullest first and leaves out deleted themes")
    void memberPortrait() {
        when(taxonomy.listCategories()).thenReturn(List.of(
                Category.builder().id(1L).name("Backend").build(), Category.builder().id(2L).name("Data & IA").build()));
        when(members.byInterest()).thenReturn(Map.of(1L, 4L, 2L, 9L, 99L, 3L));
        when(members.bySituation()).thenReturn(Map.of("STUDENT", 2L, "EMPLOYED", 7L));
        when(accounts.membersByStatus()).thenReturn(Map.of("ACTIVE", 12L, "BANNED", 1L));
        when(accounts.membersByProvider()).thenReturn(Map.of("GOOGLE", 5L));

        var portrait = stats.memberPortrait();

        assertThat(portrait.members()).isEqualTo(13);
        assertThat(portrait.interests()).containsExactly(new NamedCount("Data & IA", 9), new NamedCount("Backend", 4));
        assertThat(portrait.situations()).containsExactly(new NamedCount("EMPLOYED", 7), new NamedCount("STUDENT", 2));
        assertThat(portrait.providers()).containsExactly(new NamedCount("GOOGLE", 5));
        assertThat(portrait.goals()).isEmpty();
    }

    private static JsonNode json(String text) throws Exception {
        return new ObjectMapper().readTree(text);
    }

    private StatsServiceImpl withUmami(UmamiClient umami) {
        return new StatsServiceImpl(accounts, members, engagement, events,
                mock(ContentStatistics.class), mock(NewsletterStatistics.class), umami, taxonomy);
    }

    @Test
    @DisplayName("the audience carries the site's custom events, and survives when only they fail")
    void audienceEvents() throws Exception {
        UmamiClient umami = mock(UmamiClient.class);
        when(umami.isEnabled()).thenReturn(true);
        when(umami.stats(any(), any())).thenReturn(json("{\"visitors\":{\"value\":612},\"visits\":{\"value\":903}}"));
        when(umami.pageviews(any(), any())).thenReturn(json("{\"pageviews\":[],\"sessions\":[]}"));
        when(umami.metrics(anyString(), any(), any(), anyInt())).thenReturn(json("[]"));
        when(umami.metrics(eq("event"), any(), any(), anyInt())).thenReturn(json("[{\"x\":\"Créer un compte\",\"y\":14}]"));

        assertThat(withUmami(umami).audience(30).events()).containsExactly(new NamedCount("Créer un compte", 14));

        when(umami.metrics(eq("event"), any(), any(), anyInt())).thenThrow(new IllegalStateException("Umami down"));
        var audience = withUmami(umami).audience(30);
        assertThat(audience.available()).isTrue();
        assertThat(audience.visitors()).isEqualTo(612);
        assertThat(audience.events()).isEmpty();
    }

    @Test
    @DisplayName("conversions put each event's page views beside its registrations, and list the channels that bring members")
    void conversions() {
        when(accounts.signupsBySource(any())).thenReturn(Map.of("WhatsApp", 7L));
        when(accounts.signupsByLandingPage(any(), anyInt())).thenReturn(Map.of("/evenements/hackathon", 4L));
        when(events.funnels(12)).thenReturn(List.of(new EventStatistics.EventFunnel(1L, "hackathon", "Hackathon", Instant.EPOCH, true, 30, 0, 9)));
        when(engagement.countsOf(eq(TargetType.EVENT), any())).thenReturn(Map.of(1L, new Counts(400, 0)));

        var conversions = stats.conversions(30);

        assertThat(conversions.signupsBySource()).containsExactly(new NamedCount("WhatsApp", 7));
        assertThat(conversions.signupsByLandingPage()).containsExactly(new NamedCount("/evenements/hackathon", 4));
        assertThat(conversions.events()).singleElement().satisfies(event -> {
            assertThat(event.views()).isEqualTo(400);
            assertThat(event.registrations()).isEqualTo(30);
            assertThat(event.projects()).isEqualTo(9);
        });
    }
}
