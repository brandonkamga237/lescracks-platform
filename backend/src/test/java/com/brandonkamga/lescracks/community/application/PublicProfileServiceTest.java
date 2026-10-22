package com.brandonkamga.lescracks.community.application;

import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.recognition.application.BadgeService;
import com.brandonkamga.lescracks.recognition.application.CertificateService;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PublicProfileServiceTest {

    private final MemberDirectory people = mock(MemberDirectory.class);
    private final BadgeService badges = mock(BadgeService.class);
    private final CertificateService certificates = mock(CertificateService.class);
    private final PublicProfileServiceImpl service = new PublicProfileServiceImpl(people, badges, certificates);

    @Test
    @DisplayName("an active member has a public profile with their badges and attestations")
    void showsActiveMembers() {
        Member awa = Member.builder().id(7L).email("awa@example.com").active(true).build();
        when(people.require(7L)).thenReturn(awa);
        when(badges.listOf(7L)).thenReturn(List.of());
        when(certificates.listIssuedTo(7L)).thenReturn(List.of());

        assertThat(service.require(7L).member()).isSameAs(awa);
    }

    @Test
    @DisplayName("a suspended or banned account has no public face")
    void hidesOthers() {
        when(people.require(8L)).thenReturn(Member.builder().id(8L).active(false).build());

        assertThatThrownBy(() -> service.require(8L)).isInstanceOf(NotFoundException.class);
    }
}
