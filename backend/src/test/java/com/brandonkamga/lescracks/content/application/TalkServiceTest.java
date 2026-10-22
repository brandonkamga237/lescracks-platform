package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TalkServiceTest {

    private final InMemoryContent.Talks talks = new InMemoryContent.Talks();
    private final InMemoryContent.Engagement engagement = new InMemoryContent.Engagement();
    private final TalkService service = new TalkServiceImpl(talks, engagement);

    private TalkDraft draft(String youtubeUrl, TalkStatus status, String cover) {
        return new TalkDraft("  Épisode 1 ", "Une conversation", "  ", youtubeUrl, 42, null, status, cover);
    }

    @Test
    @DisplayName("an episode is stored trimmed, a blank guest as none, and a draft by default")
    void createsAnEpisode() {
        Talk created = service.create(draft(" https://youtu.be/abc ", null, null));

        Talk stored = talks.stored(created.getId());
        assertThat(stored.getTitle()).isEqualTo("Épisode 1");
        assertThat(stored.getYoutubeUrl()).isEqualTo("https://youtu.be/abc");
        assertThat(stored.getGuest()).isNull();
        assertThat(stored.getStatus()).isEqualTo(TalkStatus.DRAFT);
    }

    @Test
    @DisplayName("only a YouTube link is accepted, and only a cover uploaded to the platform")
    void refusesForeignLinks() {
        assertThatThrownBy(() -> service.create(draft("https://vimeo.com/1", null, null))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.create(draft("https://youtu.be/abc", null, "https://elsewhere/x.png")))
                .isInstanceOf(BadRequestException.class);
        assertThat(service.listAll(new PageQuery(0, 10)).total()).isZero();
    }

    @Test
    @DisplayName("an unpublished episode is a 404 for visitors")
    void hidesDrafts() {
        Talk draft = service.create(draft("https://youtu.be/abc", TalkStatus.DRAFT, null));
        Talk live = service.create(draft("https://youtu.be/def", TalkStatus.PUBLISHED, "/api/files/x.png"));

        assertThatThrownBy(() -> service.requirePublished(draft.getId())).isInstanceOf(NotFoundException.class);
        assertThat(service.requirePublished(live.getId()).getCoverImage()).isEqualTo("/api/files/x.png");
    }

    @Test
    @DisplayName("deleting an episode drops its audience too")
    void deleteForgetsTheAudience() {
        Talk talk = service.create(draft("https://youtu.be/abc", TalkStatus.PUBLISHED, null));

        service.delete(talk.getId());

        assertThat(talks.findById(talk.getId())).isEmpty();
        assertThat(engagement.forgotten).containsExactly(new Target(TargetType.TALK, talk.getId()));
    }
}
