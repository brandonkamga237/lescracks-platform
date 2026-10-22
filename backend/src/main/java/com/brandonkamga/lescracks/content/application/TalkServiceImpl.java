package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;
import com.brandonkamga.lescracks.content.domain.port.TalkStore;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.time.Instant;
import java.util.Locale;

public class TalkServiceImpl implements TalkService {
    private final TalkStore talks;
    private final EngagementCounts engagement;

    public TalkServiceImpl(TalkStore talks, EngagementCounts engagement) {
        this.talks = talks;
        this.engagement = engagement;
    }

    @Override
    public Paged<Talk> listPublished(PageQuery page) {
        return talks.findAll(TalkStatus.PUBLISHED, page);
    }

    @Override
    public Talk requirePublished(Long id) {
        return talks.findById(id).filter(Talk::isPublished).orElseThrow(() -> new NotFoundException("TalkVideo", "id", id));
    }

    @Override
    public Paged<Talk> listAll(PageQuery page) {
        return talks.findAll(null, page);
    }

    @Override
    public Talk create(TalkDraft draft) {
        Talk talk = Talk.builder().build();
        apply(talk, draft);
        return talks.save(talk);
    }

    @Override
    public Talk update(Long id, TalkDraft draft) {
        Talk talk = talks.findById(id).orElseThrow(() -> new NotFoundException("TalkVideo", "id", id));
        apply(talk, draft);
        return talks.save(talk);
    }

    @Override
    public void delete(Long id) {
        talks.findById(id).orElseThrow(() -> new NotFoundException("TalkVideo", "id", id));
        talks.delete(id);
        engagement.forget(new Target(TargetType.TALK, id));
    }

    private void apply(Talk talk, TalkDraft draft) {
        String youtubeUrl = draft.youtubeUrl().trim();
        String lower = youtubeUrl.toLowerCase(Locale.ROOT);
        if (!lower.contains("youtube.com/") && !lower.contains("youtu.be/")) {
            throw new BadRequestException("Le lien doit pointer vers une vidéo YouTube (youtube.com ou youtu.be).");
        }
        talk.setTitle(draft.title().trim());
        talk.setDescription(draft.description().trim());
        talk.setGuest(draft.guest() == null || draft.guest().isBlank() ? null : draft.guest().trim());
        talk.setYoutubeUrl(youtubeUrl);
        talk.setDurationMinutes(draft.durationMinutes());
        talk.setPublishedAt(draft.publishedAt());
        talk.setStatus(draft.status() == null ? TalkStatus.DRAFT : draft.status());
        talk.setCoverImage(cover(draft.coverImage()));
        talk.setUpdatedAt(Instant.now());
    }

    /** Only an image uploaded to the platform: an arbitrary URL would hotlink someone else's server. */
    private static String cover(String coverImage) {
        if (coverImage == null || coverImage.isBlank()) return null;
        String trimmed = coverImage.trim();
        if (!trimmed.startsWith("/api/files/")) {
            throw new BadRequestException("La couverture doit être une image envoyée sur la plateforme.");
        }
        return trimmed;
    }
}
