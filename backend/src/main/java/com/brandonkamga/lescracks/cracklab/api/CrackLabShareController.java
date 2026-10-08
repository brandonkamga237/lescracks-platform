package com.brandonkamga.lescracks.cracklab.api;

import com.brandonkamga.lescracks.cracklab.domain.Badge;
import com.brandonkamga.lescracks.cracklab.domain.Challenge;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeService;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeStats;
import com.brandonkamga.lescracks.cracklab.domain.CrackLabMapper;
import com.brandonkamga.lescracks.cracklab.domain.MemberProgress;
import com.brandonkamga.lescracks.cracklab.domain.ProgressService;
import com.brandonkamga.lescracks.cracklab.domain.PublicResult;
import com.brandonkamga.lescracks.cracklab.domain.Submission;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionService;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;
import com.brandonkamga.lescracks.cracklab.infra.ShareCardRenderer;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

/**
 * The images link previews show. Public by design: they carry only what the public pages show,
 * never an answer. Cached ten minutes, so a viral link does not redraw the same image each time.
 */
@RestController
@RequestMapping("/api/cracklab/share")
public class CrackLabShareController {

    private static final Map<ChallengeDifficulty, String> LEVEL_LABEL = Map.of(
            ChallengeDifficulty.BEGINNER, "Débutant", ChallengeDifficulty.INTERMEDIATE, "Intermédiaire", ChallengeDifficulty.ADVANCED, "Avancé");
    private static final Map<ChallengeDifficulty, Integer> BARS = Map.of(
            ChallengeDifficulty.BEGINNER, 1, ChallengeDifficulty.INTERMEDIATE, 2, ChallengeDifficulty.ADVANCED, 3);

    private final ChallengeService challenges;
    private final SubmissionService submissions;
    private final ProgressService progress;
    private final ShareCardRenderer renderer;

    public CrackLabShareController(ChallengeService challenges, SubmissionService submissions, ProgressService progress, ShareCardRenderer renderer) {
        this.challenges = challenges;
        this.submissions = submissions;
        this.progress = progress;
        this.renderer = renderer;
    }

    @GetMapping("/challenges/{slug}.png")
    public ResponseEntity<byte[]> challenge(@PathVariable String slug) {
        Challenge challenge = challenges.requirePublished(slug);
        ChallengeStats stats = progress.statsFor(challenge.getId());
        String line = stats.participants() == 0
                ? "Aucune réponse encore : ouvre le bal · " + challenge.totalPoints() + " pts en jeu"
                : stats.participants() + " participant" + (stats.participants() > 1 ? "s" : "")
                + (stats.averageScore() == null ? "" : " · moyenne " + stats.averageScore() + "/" + challenge.totalPoints());
        return png(renderer.challenge(challenge.getSlug(), challenge.getTitle(), LEVEL_LABEL.get(challenge.getDifficulty()), BARS.get(challenge.getDifficulty()),
                challenge.getCategory(), line));
    }

    @GetMapping("/results/{id}.png")
    public ResponseEntity<byte[]> result(@PathVariable Long id) {
        PublicResult result = progress.result(id);
        Submission submission = result.submission();
        boolean graded = submission.getStatus() == SubmissionStatus.GRADED;
        String standing = !graded ? "Réponse en attente de notation"
                : result.rankOnChallenge() == 1 ? "Meilleur score du challenge"
                : result.stats().graded() > 1 ? "Mieux que " + result.betterThanPercent() + " % des participants" : "";
        return png(renderer.result(CrackLabMapper.displayNameOf(submission.getUser()), graded ? String.valueOf(submission.getTechnicalScore()) : "—",
                String.valueOf(submission.getChallenge().totalPoints()), submission.getChallenge().getTitle(), standing, result.authorLevel().name()));
    }

    @GetMapping("/ranking.png")
    public ResponseEntity<byte[]> ranking(@RequestParam(defaultValue = "all") String period) {
        boolean week = "week".equals(period);
        var rows = (week ? progress.weekRanking(PageRequest.of(0, 3)) : submissions.ranking(PageRequest.of(0, 3))).getContent();
        List<ShareCardRenderer.Row> podium = IntStream.range(0, rows.size()).mapToObj(i -> {
            SubmissionRepository.RankingRow row = rows.get(i);
            return new ShareCardRenderer.Row(String.valueOf(i + 1),
                    CrackLabMapper.displayName(row.getFirstName(), row.getLastName(), row.getUsername()), String.valueOf(row.getTotalScore()));
        }).toList();
        return png(renderer.ranking(week ? "Le podium de la semaine" : "Classement CrackLab", podium));
    }

    @GetMapping("/members/{id}.png")
    public ResponseEntity<byte[]> member(@PathVariable Long id) {
        MemberProgress member = progress.publicProfile(id);
        long unlocked = member.badges().stream().filter(MemberProgress.BadgeState::unlocked).count();
        return png(renderer.member(CrackLabMapper.displayNameOf(member.member()), member.level().name(),
                String.valueOf(member.xp()), member.rank() > 0 ? "#" + member.rank() : "—",
                member.streak() + " sem.", unlocked + "/" + Badge.values().length));
    }

    private static ResponseEntity<byte[]> png(byte[] image) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES).cachePublic())
                .body(image);
    }
}
