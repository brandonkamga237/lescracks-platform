package com.brandonkamga.lescracks.talk.api;

import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.talk.api.dto.TalkRequest;
import com.brandonkamga.lescracks.talk.api.dto.TalkResponse;
import com.brandonkamga.lescracks.talk.domain.TalkService;
import com.brandonkamga.lescracks.talk.domain.TalkStatus;
import com.brandonkamga.lescracks.talk.domain.TalkVideo;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/talks")
public class TalkController {

    private final TalkService talks;

    public TalkController(TalkService talks) {
        this.talks = talks;
    }

    @GetMapping
    public PageResponse<TalkResponse> published(@PageableDefault(size = 12) Pageable pageable) {
        return PageResponse.of(talks.published(pageable), TalkController::response);
    }

    @GetMapping("/{id}")
    public TalkResponse get(@PathVariable Long id) {
        TalkVideo video = talks.require(id);
        if (video.getStatus() != TalkStatus.PUBLISHED) {
            throw new NotFoundException("TalkVideo", "id", id);
        }
        return response(video);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<TalkResponse> all(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(talks.all(pageable), TalkController::response);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TalkResponse create(@Valid @RequestBody TalkRequest request) {
        return response(talks.create(request));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TalkResponse update(@PathVariable Long id, @Valid @RequestBody TalkRequest request) {
        return response(talks.update(id, request));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        talks.delete(id);
    }

    private static TalkResponse response(TalkVideo video) {
        return new TalkResponse(video.getId(), video.getTitle(), video.getDescription(), video.getGuest(),
                video.getYoutubeUrl(), video.getDurationMinutes(), video.getPublishedAt(), video.getStatus(),
                video.getCreatedAt(), video.getUpdatedAt());
    }
}
