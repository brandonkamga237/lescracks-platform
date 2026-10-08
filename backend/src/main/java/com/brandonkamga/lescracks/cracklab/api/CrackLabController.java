package com.brandonkamga.lescracks.cracklab.api;

import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeDetailResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeSummaryResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.RankingEntryResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.SubmissionResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.SubmitRequest;
import com.brandonkamga.lescracks.cracklab.api.dto.VoteRequest;
import com.brandonkamga.lescracks.cracklab.api.dto.VoteResponse;
import com.brandonkamga.lescracks.cracklab.domain.Challenge;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeService;
import com.brandonkamga.lescracks.cracklab.domain.CrackLabMapper;
import com.brandonkamga.lescracks.cracklab.domain.Submission;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionService;
import com.brandonkamga.lescracks.cracklab.domain.VoteResult;
import com.brandonkamga.lescracks.shared.dto.PageResponse;

import jakarta.validation.Valid;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.IntStream;

/**
 * CrackLab for members. Reading challenges and the ranking is open to everyone; answering,
 * seeing other answers and voting need a member account.
 */
@RestController
@RequestMapping("/api/cracklab")
public class CrackLabController {

    private final ChallengeService challenges;
    private final SubmissionService submissions;
    private final CrackLabMapper mapper;

    public CrackLabController(ChallengeService challenges, SubmissionService submissions, CrackLabMapper mapper) {
        this.challenges = challenges;
        this.submissions = submissions;
        this.mapper = mapper;
    }

    @GetMapping("/challenges")
    public PageResponse<ChallengeSummaryResponse> challenges(@RequestParam(required = false) ChallengeDifficulty difficulty,
                                                             @RequestParam(required = false) String category,
                                                             @RequestParam(required = false) String tag,
                                                             @PageableDefault(size = 12, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.of(challenges.published(difficulty, category, tag, pageable), mapper::summary);
    }

    @GetMapping("/challenges/{slug}")
    public ChallengeDetailResponse challenge(@PathVariable String slug, Authentication authentication) {
        String email = viewer(authentication);
        Challenge challenge = challenges.requirePublished(slug);
        Long viewerId = submissions.memberId(email).orElse(null);
        SubmissionResponse mine = submissions.mine(challenge.getId(), email)
                .map(submission -> mapper.submission(submission, viewerId, 0))
                .orElse(null);
        return mapper.detail(challenge, mine);
    }

    @PostMapping("/challenges/{slug}/submissions")
    @ResponseStatus(HttpStatus.CREATED)
    public SubmissionResponse submit(@PathVariable String slug, @Valid @RequestBody SubmitRequest request, Principal principal) {
        Submission submission = submissions.submit(slug, principal.getName(), request.answer());
        return mapper.submission(submission, submission.getUser().getId(), 0);
    }

    @GetMapping("/challenges/{slug}/submissions")
    public List<SubmissionResponse> answers(@PathVariable String slug, Principal principal) {
        return withVotes(submissions.forChallenge(slug, principal.getName()), principal.getName());
    }

    @GetMapping("/submissions/mine")
    public List<SubmissionResponse> mine(Principal principal) {
        return withVotes(submissions.mineAll(principal.getName()), principal.getName());
    }

    @PutMapping("/submissions/{id}/vote")
    public VoteResponse vote(@PathVariable Long id, @Valid @RequestBody VoteRequest request, Principal principal) {
        VoteResult result = submissions.vote(id, principal.getName(), request.value());
        return new VoteResponse(result.voteScore(), result.myVote());
    }

    @GetMapping("/ranking")
    public PageResponse<RankingEntryResponse> ranking(@PageableDefault(size = 20) Pageable pageable, Authentication authentication) {
        Long viewerId = submissions.memberId(viewer(authentication)).orElse(null);
        // The query fixes its own order; a client-supplied sort would only scramble the ranking.
        Pageable page = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        var rows = submissions.ranking(page);
        int first = (int) page.getOffset();
        List<RankingEntryResponse> entries = IntStream.range(0, rows.getNumberOfElements())
                .mapToObj(i -> mapper.ranking(first + i + 1, rows.getContent().get(i), viewerId))
                .toList();
        return PageResponse.of(new PageImpl<>(entries, page, rows.getTotalElements()), Function.identity());
    }

    private List<SubmissionResponse> withVotes(List<Submission> list, String email) {
        Long viewerId = submissions.memberId(email).orElse(null);
        Map<Long, Integer> votes = submissions.myVotes(list.stream().map(Submission::getId).toList(), email);
        return list.stream().map(submission -> mapper.submission(submission, viewerId, votes.getOrDefault(submission.getId(), 0))).toList();
    }

    /** Anonymous visitors read too; an anonymous token is not a member. */
    private static String viewer(Authentication authentication) {
        return authentication == null || authentication instanceof AnonymousAuthenticationToken ? null : authentication.getName();
    }
}
