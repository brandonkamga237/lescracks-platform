package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Mentorship;
import com.brandonkamga.lescracks.dto.mentorship.MentorshipRequest;
import com.brandonkamga.lescracks.dto.mentorship.MentorshipResponse;
import com.brandonkamga.lescracks.mapper.MediaMapper;
import com.brandonkamga.lescracks.service.interfaces.MentorshipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * The Accompagnement 360: read by anyone, opened and closed by an admin.
 *
 * Public and admin routes live together because they are the same subject. Splitting them
 * into a separate admin controller is what produced the seven-hundred-line file that touched
 * everything and belonged to nothing.
 */
@RestController
@RequestMapping("/api/mentorship")
@Tag(name = "Accompagnement 360")
public class MentorshipController {

    private final MentorshipService mentorship;
    private final MediaMapper mediaMapper;

    public MentorshipController(MentorshipService mentorship, MediaMapper mediaMapper) {
        this.mentorship = mentorship;
        this.mediaMapper = mediaMapper;
    }

    @GetMapping
    @Operation(summary = "Le programme et s'il accepte des candidatures")
    public MentorshipResponse get() {
        return toResponse(mentorship.current());
    }

    @PutMapping("/admin/open")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Ouvrir ou fermer les candidatures")
    public MentorshipResponse setOpen(@RequestParam boolean open) {
        return toResponse(mentorship.setOpen(open));
    }

    @PutMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier la présentation du programme")
    public MentorshipResponse update(@Valid @RequestBody MentorshipRequest request) {
        return toResponse(mentorship.update(
                request.title(), request.summary(), request.description(), request.coverId()));
    }

    private MentorshipResponse toResponse(Mentorship source) {
        return new MentorshipResponse(
                source.isOpen(), source.getTitle(), source.getSummary(),
                source.getDescription(), mediaMapper.toResponse(source.getCover()));
    }
}
