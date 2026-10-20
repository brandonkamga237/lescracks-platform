package com.brandonkamga.lescracks.event.api;

import com.brandonkamga.lescracks.event.api.dto.AdminRegistrationResponse;
import com.brandonkamga.lescracks.event.api.dto.AdminSubmissionResponse;
import com.brandonkamga.lescracks.event.api.dto.AttendanceRequest;
import com.brandonkamga.lescracks.event.api.dto.MyEventResponse;
import com.brandonkamga.lescracks.event.api.dto.RegistrationResponse;
import com.brandonkamga.lescracks.event.api.dto.ReviewRequest;
import com.brandonkamga.lescracks.event.api.dto.SubmissionRequest;
import com.brandonkamga.lescracks.event.api.dto.SubmissionResponse;
import com.brandonkamga.lescracks.event.domain.EventRegistrationService;
import com.brandonkamga.lescracks.event.domain.EventSubmissionService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Taking part in an event: signing up, handing in a project, and the admin side of both
 * (attendance, review). Reading events stays in EventController.
 */
@RestController
@RequestMapping("/api/events")
public class EventParticipationController {
    private final EventRegistrationService registrations;
    private final EventSubmissionService submissions;

    public EventParticipationController(EventRegistrationService registrations, EventSubmissionService submissions) {
        this.registrations = registrations;
        this.submissions = submissions;
    }

    @GetMapping("/{id}/registration")
    public RegistrationResponse registration(@PathVariable Long id, Principal principal) {
        return registrations.find(id, principal.getName()).map(RegistrationResponse::of).orElseGet(RegistrationResponse::none);
    }

    @PostMapping("/{id}/registration")
    public RegistrationResponse register(@PathVariable Long id, Principal principal) {
        return RegistrationResponse.of(registrations.register(id, principal.getName()));
    }

    @DeleteMapping("/{id}/registration")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long id, Principal principal) {
        registrations.cancel(id, principal.getName());
    }

    /** Under /registrations/ so it never reads as an event slug on the public /api/events/{slug}. */
    @GetMapping("/registrations/mine")
    public List<MyEventResponse> mine(Principal principal) {
        return registrations.mine(principal.getName()).stream().map(MyEventResponse::of).toList();
    }

    @GetMapping("/{id}/submission")
    public ResponseEntity<SubmissionResponse> submission(@PathVariable Long id, Principal principal) {
        return submissions.mine(id, principal.getName())
                .map(view -> ResponseEntity.ok(SubmissionResponse.of(view, principal.getName())))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/submission")
    public SubmissionResponse submit(@PathVariable Long id, @Valid @RequestBody SubmissionRequest request, Principal principal) {
        return SubmissionResponse.of(submissions.submit(id, principal.getName(), request.toDraft()), principal.getName());
    }

    @GetMapping("/admin/{id}/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminRegistrationResponse> registrations(@PathVariable Long id) {
        return registrations.forEvent(id).stream().map(AdminRegistrationResponse::of).toList();
    }

    @PatchMapping("/admin/registrations/{registrationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public RegistrationResponse attendance(@PathVariable Long registrationId, @Valid @RequestBody AttendanceRequest request) {
        return RegistrationResponse.of(registrations.markAttendance(registrationId, request.status()));
    }

    @GetMapping("/admin/{id}/submissions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminSubmissionResponse> submissions(@PathVariable Long id) {
        return submissions.forEvent(id).stream().map(AdminSubmissionResponse::of).toList();
    }

    @PatchMapping("/admin/submissions/{submissionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminSubmissionResponse review(@PathVariable Long submissionId, @Valid @RequestBody ReviewRequest request) {
        return AdminSubmissionResponse.of(submissions.review(submissionId, request.toReview()));
    }
}
