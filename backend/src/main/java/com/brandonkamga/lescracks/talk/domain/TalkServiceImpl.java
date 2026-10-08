package com.brandonkamga.lescracks.talk.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.talk.api.dto.TalkRequest;
import com.brandonkamga.lescracks.talk.infra.TalkVideoRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
@Transactional
public class TalkServiceImpl implements TalkService {

    private final TalkVideoRepository talks;

    public TalkServiceImpl(TalkVideoRepository talks) {
        this.talks = talks;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TalkVideo> published(Pageable pageable) {
        return talks.findByStatusOrderByPublishedAtDesc(TalkStatus.PUBLISHED, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TalkVideo> all(Pageable pageable) {
        return talks.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public TalkVideo require(Long id) {
        return talks.findById(id).orElseThrow(() -> new NotFoundException("TalkVideo", "id", id));
    }

    @Override
    public TalkVideo create(TalkRequest request) {
        return talks.save(apply(new TalkVideo(), request));
    }

    @Override
    public TalkVideo update(Long id, TalkRequest request) {
        return apply(require(id), request);
    }

    @Override
    public void delete(Long id) {
        talks.delete(require(id));
    }

    private TalkVideo apply(TalkVideo video, TalkRequest request) {
        String youtubeUrl = request.youtubeUrl().trim();
        if (!isYoutubeUrl(youtubeUrl)) {
            throw new BadRequestException("Le lien doit pointer vers une vidéo YouTube (youtube.com ou youtu.be).");
        }
        video.setTitle(request.title().trim());
        video.setDescription(request.description().trim());
        video.setGuest(request.guest() == null || request.guest().isBlank() ? null : request.guest().trim());
        video.setYoutubeUrl(youtubeUrl);
        video.setDurationMinutes(request.durationMinutes());
        video.setPublishedAt(request.publishedAt());
        video.setStatus(request.status() == null ? TalkStatus.DRAFT : request.status());
        video.setCoverImage(cover(request.coverImage()));
        video.setUpdatedAt(Instant.now());
        return video;
    }

    /** Only an image uploaded to the platform: an arbitrary URL would hotlink someone else's server. */
    private String cover(String coverImage) {
        if (coverImage == null || coverImage.isBlank()) {
            return null;
        }
        String trimmed = coverImage.trim();
        if (!trimmed.startsWith("/api/files/")) {
            throw new BadRequestException("La couverture doit être une image envoyée sur la plateforme.");
        }
        return trimmed;
    }

    private boolean isYoutubeUrl(String url) {
        String lower = url.toLowerCase(Locale.ROOT);
        return lower.contains("youtube.com/") || lower.contains("youtu.be/");
    }
}
