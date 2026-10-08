package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeRequest;
import com.brandonkamga.lescracks.cracklab.infra.ChallengeRepository;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.Slugs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChallengeServiceImpl implements ChallengeService {

    private final ChallengeRepository challenges;
    private final SubmissionRepository submissions;

    public ChallengeServiceImpl(ChallengeRepository challenges, SubmissionRepository submissions) {
        this.challenges = challenges;
        this.submissions = submissions;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Challenge> published(ChallengeDifficulty difficulty, String category, String tag, Pageable pageable) {
        return challenges.search(ChallengeStatus.PUBLISHED, difficulty, blankToNull(category), blankToNull(tag), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Challenge requirePublished(String slug) {
        return challenges.findBySlug(slug)
                .filter(challenge -> challenge.getStatus() == ChallengeStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Challenge", "slug", slug));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Challenge> all(Pageable pageable) {
        return challenges.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Challenge require(Long id) {
        return challenges.findById(id).orElseThrow(() -> new NotFoundException("Challenge", "id", id));
    }

    @Override
    public Challenge create(ChallengeRequest request, String adminUsername) {
        Challenge challenge = new Challenge();
        challenge.setSlug(Slugs.uniqueFrom(request.title(), challenges::existsBySlug));
        challenge.setCreatedBy(adminUsername);
        apply(challenge, request);
        replaceCriteria(challenge, request.criteria());
        return challenges.save(challenge);
    }

    @Override
    public Challenge update(Long id, ChallengeRequest request) {
        Challenge challenge = require(id);
        apply(challenge, request);
        if (gradingLocked(id)) {
            relabelCriteria(challenge, request.criteria());
        } else {
            replaceCriteria(challenge, request.criteria());
        }
        return challenge;
    }

    @Override
    public void delete(Long id) {
        Challenge challenge = require(id);
        if (submissions.countByChallengeId(id) > 0) {
            throw new ConflictException("Ce challenge a déjà des réponses : archive-le plutôt que de le supprimer.");
        }
        challenges.delete(challenge);
    }

    @Override
    @Transactional(readOnly = true)
    public long submissionCount(Long challengeId) {
        return submissions.countByChallengeId(challengeId);
    }

    @Override
    @Transactional(readOnly = true)
    public long pendingCount(Long challengeId) {
        return submissions.countByChallengeIdAndStatus(challengeId, SubmissionStatus.SUBMITTED);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean gradingLocked(Long challengeId) {
        return challengeId != null && submissions.existsByChallengeIdAndStatus(challengeId, SubmissionStatus.GRADED);
    }

    private void apply(Challenge challenge, ChallengeRequest request) {
        challenge.setTitle(request.title().trim());
        challenge.setCategory(request.category().trim());
        challenge.setDifficulty(request.difficulty());
        challenge.setProblem(request.problem().trim());
        challenge.setConstraints(blankToNull(request.constraints()));
        challenge.setExpectedFormat(blankToNull(request.expectedFormat()));
        challenge.setMaxWords(request.maxWords());
        challenge.setReferenceSolution(request.referenceSolution().trim());
        challenge.setTags(request.tags() == null ? new LinkedHashSet<>() : request.tags().stream()
                .map(String::trim).filter(tag -> !tag.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new)));
        ChallengeStatus status = request.status() == null ? ChallengeStatus.DRAFT : request.status();
        if (status == ChallengeStatus.PUBLISHED && challenge.getPublishedAt() == null) {
            challenge.setPublishedAt(Instant.now());
        }
        challenge.setStatus(status);
        challenge.setUpdatedAt(Instant.now());
    }

    /** Before any grading: criteria are matched by id when kept, the rest are added or dropped. */
    private void replaceCriteria(Challenge challenge, List<ChallengeRequest.CriterionRequest> requested) {
        Map<Long, ChallengeCriterion> existing = challenge.getCriteria().stream()
                .filter(criterion -> criterion.getId() != null)
                .collect(Collectors.toMap(ChallengeCriterion::getId, Function.identity()));
        List<ChallengeCriterion> next = new ArrayList<>();
        for (int position = 0; position < requested.size(); position++) {
            ChallengeRequest.CriterionRequest item = requested.get(position);
            ChallengeCriterion criterion = item.id() != null && existing.containsKey(item.id())
                    ? existing.get(item.id()) : new ChallengeCriterion();
            criterion.setChallenge(challenge);
            criterion.setLabel(item.label().trim());
            criterion.setMaxPoints(item.maxPoints());
            criterion.setPosition(position);
            next.add(criterion);
        }
        challenge.getCriteria().clear();
        challenge.getCriteria().addAll(next);
    }

    /**
     * Once a submission is graded its score is a sum over these exact criteria: only the wording
     * may still change, never the list or the points.
     */
    private void relabelCriteria(Challenge challenge, List<ChallengeRequest.CriterionRequest> requested) {
        List<ChallengeCriterion> current = challenge.getCriteria();
        boolean sameShape = current.size() == requested.size();
        for (int i = 0; sameShape && i < current.size(); i++) {
            sameShape = Objects.equals(current.get(i).getId(), requested.get(i).id())
                    && Objects.equals(current.get(i).getMaxPoints(), requested.get(i).maxPoints());
        }
        if (!sameShape) {
            throw new ConflictException("Des réponses ont déjà été notées : la grille ne peut plus changer, seuls les libellés sont modifiables.");
        }
        for (int i = 0; i < current.size(); i++) {
            current.get(i).setLabel(requested.get(i).label().trim());
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
