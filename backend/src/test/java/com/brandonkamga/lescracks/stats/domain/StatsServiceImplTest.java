package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.event.infra.EventRepository;
import com.brandonkamga.lescracks.identity.domain.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.MemberSituation;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.stats.api.dto.NamedCount;
import com.brandonkamga.lescracks.stats.infra.UmamiClient;
import com.brandonkamga.lescracks.talk.infra.TalkVideoRepository;
import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StatsServiceImplTest {

    private final UserRepository users = mock(UserRepository.class);
    private final CategoryRepository categories = mock(CategoryRepository.class);
    private final StatsServiceImpl stats = new StatsServiceImpl(users, mock(EventRepository.class), mock(ResourceRepository.class),
            mock(NewsletterSubscriptionRepository.class), mock(TalkVideoRepository.class), mock(UmamiClient.class), categories);

    private static List<Object[]> rows(Object[]... rows) {
        return List.of(rows);
    }

    @Test
    @DisplayName("the portrait names each interest, puts the fullest first and leaves out deleted themes")
    void memberPortrait() {
        when(categories.findAll()).thenReturn(List.of(
                Category.builder().id(1L).name("Backend").build(), Category.builder().id(2L).name("Data & IA").build()));
        when(users.countMembersGroupedByInterest()).thenReturn(rows(new Object[]{1L, 4L}, new Object[]{2L, 9L}, new Object[]{99L, 3L}));
        when(users.countMembersGroupedBySituation()).thenReturn(rows(new Object[]{MemberSituation.STUDENT, 2L}, new Object[]{MemberSituation.EMPLOYED, 7L}));
        when(users.countMembersGroupedByStatus()).thenReturn(rows(new Object[]{"ACTIVE", 12L}, new Object[]{"BANNED", 1L}));
        when(users.countMembersGroupedByProvider()).thenReturn(rows(new Object[]{AuthProvider.GOOGLE, 5L}));

        var portrait = stats.memberPortrait();

        assertThat(portrait.members()).isEqualTo(13);
        assertThat(portrait.interests()).containsExactly(new NamedCount("Data & IA", 9), new NamedCount("Backend", 4));
        assertThat(portrait.situations()).containsExactly(new NamedCount("EMPLOYED", 7), new NamedCount("STUDENT", 2));
        assertThat(portrait.providers()).containsExactly(new NamedCount("GOOGLE", 5));
        assertThat(portrait.goals()).isEmpty();
    }
}
