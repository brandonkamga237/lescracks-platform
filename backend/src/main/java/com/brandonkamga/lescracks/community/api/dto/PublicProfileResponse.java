package com.brandonkamga.lescracks.community.api.dto;

import com.brandonkamga.lescracks.community.application.PublicProfile;
import com.brandonkamga.lescracks.recognition.api.dto.MemberBadgeResponse;
import com.brandonkamga.lescracks.storage.domain.StoredFiles;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * A member as anyone sees them. Name, photo, badges and attestations always; bio, city and links
 * only when the member opened them. Never the email or the phone.
 */
public record PublicProfileResponse(Long id, String name, String avatarUrl, Instant memberSince, String bio, String location,
                                    Map<String, String> links, List<MemberBadgeResponse> badges,
                                    List<PublicCertificate> certificates) {

    public record PublicCertificate(String code, String title, Instant issuedAt) {
    }

    public static PublicProfileResponse of(PublicProfile profile) {
        var member = profile.member();
        String name = ((member.getFirstName() == null ? "" : member.getFirstName()) + " " + (member.getLastName() == null ? "" : member.getLastName())).trim();
        return new PublicProfileResponse(member.getId(), name.isEmpty() ? "Membre LesCracks" : name,
                StoredFiles.publicPath(member.getAvatarUrl()), member.getCreatedAt(),
                member.isPublicBio() ? member.getBio() : null,
                member.isPublicLocation() ? member.getLocation() : null,
                member.isPublicLinks() && member.getSocialLinks() != null && !member.getSocialLinks().isEmpty() ? member.getSocialLinks() : null,
                profile.badges().stream().map(MemberBadgeResponse::of).toList(),
                profile.certificates().stream().map(c -> new PublicCertificate(c.getCode(), c.getTitle(), c.getIssuedAt())).toList());
    }
}
