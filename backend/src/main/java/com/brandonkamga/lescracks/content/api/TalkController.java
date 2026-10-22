package com.brandonkamga.lescracks.content.api;

import com.brandonkamga.lescracks.content.api.dto.TalkRequest;
import com.brandonkamga.lescracks.content.api.dto.TalkResponse;
import com.brandonkamga.lescracks.content.application.TalkService;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.paging.PageQuery;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/talks")
public class TalkController {
    private static final int MAX_PAGE_SIZE = 100;

    private final TalkService talks;

    public TalkController(TalkService talks) {
        this.talks = talks;
    }

    @GetMapping
    public PageResponse<TalkResponse> published(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "12") int size) {
        return PageResponse.of(talks.listPublished(pageOf(page, size)), TalkResponse::of);
    }

    @GetMapping("/{id}")
    public TalkResponse get(@PathVariable Long id) {
        return TalkResponse.of(talks.requirePublished(id));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<TalkResponse> all(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(talks.listAll(pageOf(page, size)), TalkResponse::of);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public TalkResponse create(@Valid @RequestBody TalkRequest request) {
        return TalkResponse.of(talks.create(request.toDraft()));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TalkResponse update(@PathVariable Long id, @Valid @RequestBody TalkRequest request) {
        return TalkResponse.of(talks.update(id, request.toDraft()));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        talks.delete(id);
    }

    private static PageQuery pageOf(int page, int size) {
        return new PageQuery(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
    }
}
