package com.brandonkamga.lescracks.cracklab.api;

import com.brandonkamga.lescracks.cracklab.api.dto.AdminChallengeResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeRequest;
import com.brandonkamga.lescracks.cracklab.api.dto.GradeRequest;
import com.brandonkamga.lescracks.cracklab.api.dto.SubmissionResponse;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeService;
import com.brandonkamga.lescracks.cracklab.domain.CrackLabMapper;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionService;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;
import com.brandonkamga.lescracks.shared.dto.PageResponse;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/** CrackLab back office: write challenges and their rubric, then grade the answers. */
@RestController
@RequestMapping("/api/cracklab/admin")
@PreAuthorize("hasRole('ADMIN')")
public class CrackLabAdminController {

    private final ChallengeService challenges;
    private final SubmissionService submissions;
    private final CrackLabMapper mapper;

    public CrackLabAdminController(ChallengeService challenges, SubmissionService submissions, CrackLabMapper mapper) {
        this.challenges = challenges;
        this.submissions = submissions;
        this.mapper = mapper;
    }

    @GetMapping("/challenges")
    public PageResponse<AdminChallengeResponse> challenges(@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.of(challenges.all(pageable), mapper::admin);
    }

    @GetMapping("/challenges/{id}")
    public AdminChallengeResponse challenge(@PathVariable Long id) {
        return mapper.admin(challenges.require(id));
    }

    @PostMapping("/challenges")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminChallengeResponse create(@Valid @RequestBody ChallengeRequest request, Principal principal) {
        return mapper.admin(challenges.create(request, principal.getName()));
    }

    @PutMapping("/challenges/{id}")
    public AdminChallengeResponse update(@PathVariable Long id, @Valid @RequestBody ChallengeRequest request) {
        return mapper.admin(challenges.update(id, request));
    }

    @DeleteMapping("/challenges/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        challenges.delete(id);
    }

    /** The grading queue: pending answers first by default, oldest first so nobody waits forever. */
    @GetMapping("/submissions")
    public PageResponse<SubmissionResponse> submissions(@RequestParam(required = false) SubmissionStatus status,
                                                        @RequestParam(required = false) Long challengeId,
                                                        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return PageResponse.of(submissions.forAdmin(status, challengeId, pageable), submission -> mapper.submission(submission, null, 0));
    }

    @GetMapping("/submissions/{id}")
    public SubmissionResponse submission(@PathVariable Long id) {
        return mapper.submission(submissions.require(id), null, 0);
    }

    @PutMapping("/submissions/{id}/evaluation")
    public SubmissionResponse grade(@PathVariable Long id, @Valid @RequestBody GradeRequest request, Principal principal) {
        return mapper.submission(submissions.grade(id, request, principal.getName()), null, 0);
    }
}
