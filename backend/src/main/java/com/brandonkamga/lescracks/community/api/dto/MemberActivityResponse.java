package com.brandonkamga.lescracks.community.api.dto;

import com.brandonkamga.lescracks.community.application.MemberActivity;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateKind;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** A member's history as the admin sheet shows it. */
public record MemberActivityResponse(List<EventEntry> events, List<BadgeEntry> badges, List<CertificateEntry> certificates,
                                     long comments) {

    public record Project(Long id, String title, SubmissionStatus status, Integer rank) {
    }

    public record EventEntry(Long id, String slug, String title, String type, Instant startDate, RegistrationStatus status,
                             Project project) {
    }

    public record BadgeEntry(Long badgeId, String code, String name, String icon, boolean system, Instant awardedAt, String reason) {
    }

    public record CertificateEntry(String code, CertificateKind kind, String title, Instant issuedAt) {
    }

    public static MemberActivityResponse of(MemberActivity activity) {
        Map<Long, Submission> projectByEvent = activity.projects().stream()
                .collect(Collectors.toMap(Submission::getEventId, Function.identity(), (first, second) -> first));
        return new MemberActivityResponse(
                activity.events().stream().map(mine -> {
                    var event = mine.event();
                    Submission project = projectByEvent.get(event.getId());
                    return new EventEntry(event.getId(), event.getSlug(), event.getTitle(), event.getType().name(), event.getStartDate(),
                            mine.registration().getStatus(),
                            project == null ? null : new Project(project.getId(), project.getTitle(), project.getStatus(), project.getRank()));
                }).toList(),
                activity.badges().stream().map(award -> new BadgeEntry(award.getBadge().getId(), award.getBadge().getCode(),
                        award.getBadge().getName(), award.getBadge().getIcon(), award.getBadge().isSystem(), award.getAwardedAt(),
                        award.getReason())).toList(),
                activity.certificates().stream().map(certificate -> new CertificateEntry(certificate.getCode(), certificate.getKind(),
                        certificate.getTitle(), certificate.getIssuedAt())).toList(),
                activity.comments());
    }
}
