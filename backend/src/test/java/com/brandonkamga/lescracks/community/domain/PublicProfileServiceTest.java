package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserDirectory;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;
import com.brandonkamga.lescracks.recognition.domain.BadgeService;
import com.brandonkamga.lescracks.recognition.domain.CertificateService;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PublicProfileServiceTest {

    private final UserDirectory people = mock(UserDirectory.class);
    private final BadgeService badges = mock(BadgeService.class);
    private final CertificateService certificates = mock(CertificateService.class);
    private final PublicProfileServiceImpl service = new PublicProfileServiceImpl(people, badges, certificates);

    @Test
    @DisplayName("an active member has a public profile with their badges and attestations")
    void showsActiveMembers() {
        User awa = User.builder().id(7L).email("awa@example.com").passwordHash("h").status(UserStatus.ACTIVE).build();
        when(people.require(7L)).thenReturn(awa);
        when(badges.badgesOf(7L)).thenReturn(List.of());
        when(certificates.issuedTo(7L)).thenReturn(List.of());

        assertThat(service.of(7L).member()).isSameAs(awa);
    }

    @Test
    @DisplayName("a banned account and a newsletter-only contact have no public face")
    void hidesOthers() {
        when(people.require(8L)).thenReturn(User.builder().id(8L).passwordHash("h").status(UserStatus.BANNED).build());
        when(people.require(9L)).thenReturn(User.builder().id(9L).provider(AuthProvider.LOCAL).status(UserStatus.ACTIVE).build());

        assertThatThrownBy(() -> service.of(8L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.of(9L)).isInstanceOf(NotFoundException.class);
    }
}
