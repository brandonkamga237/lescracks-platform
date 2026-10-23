package com.brandonkamga.lescracks.recognition.api;

import com.brandonkamga.lescracks.recognition.api.dto.AwardRequest;
import com.brandonkamga.lescracks.recognition.api.dto.BadgeHolderResponse;
import com.brandonkamga.lescracks.recognition.api.dto.BadgeRequest;
import com.brandonkamga.lescracks.recognition.api.dto.BadgeResponse;
import com.brandonkamga.lescracks.recognition.api.dto.BulkAwardRequest;
import com.brandonkamga.lescracks.recognition.api.dto.BulkAwardResponse;
import com.brandonkamga.lescracks.recognition.api.dto.MemberBadgeResponse;
import com.brandonkamga.lescracks.recognition.application.BadgeService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {
    private final BadgeService badges;

    public BadgeController(BadgeService badges) {
        this.badges = badges;
    }

    @GetMapping("/mine")
    public List<MemberBadgeResponse> mine(Principal principal) {
        return badges.listMine(principal.getName()).stream().map(MemberBadgeResponse::of).toList();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BadgeResponse> catalogue() {
        Map<Long, Long> holders = badges.countHolders();
        return badges.listCatalogue().stream().map(badge -> BadgeResponse.of(badge, holders.getOrDefault(badge.getId(), 0L))).toList();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BadgeResponse create(@Valid @RequestBody BadgeRequest request) {
        return BadgeResponse.of(badges.create(request.toDraft()), 0);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BadgeResponse update(@PathVariable Long id, @Valid @RequestBody BadgeRequest request) {
        return BadgeResponse.of(badges.update(id, request.toDraft()), badges.countHolders().getOrDefault(id, 0L));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        badges.delete(id);
    }

    @GetMapping("/admin/{id}/holders")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BadgeHolderResponse> holders(@PathVariable Long id) {
        return badges.listHolders(id).stream().map(BadgeHolderResponse::of).toList();
    }

    @PostMapping("/admin/{id}/holders")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void award(@PathVariable Long id, @Valid @RequestBody AwardRequest request) {
        badges.awardByEmail(id, request.email(), request.reason());
    }

    /** Many members at once: pasted emails and/or the people of an event. Each new holder gets an email. */
    @PostMapping("/admin/{id}/holders/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public BulkAwardResponse awardMany(@PathVariable Long id, @Valid @RequestBody BulkAwardRequest request) {
        return BulkAwardResponse.of(badges.awardMany(id, request.toGrant()));
    }

    @DeleteMapping("/admin/{id}/holders/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id, @PathVariable Long userId) {
        badges.revoke(id, userId);
    }
}
