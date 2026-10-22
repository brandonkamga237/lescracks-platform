package com.brandonkamga.lescracks.community.api;

import com.brandonkamga.lescracks.community.api.dto.PublicProfileResponse;
import com.brandonkamga.lescracks.community.application.PublicProfile;
import com.brandonkamga.lescracks.member.application.Member;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PublicProfileResponseTest {

    private static Member member(boolean open) {
        return Member.builder().id(7L).email("awa@example.com").firstName("Awa").lastName("Diallo")
                .bio("Développeuse backend").location("Douala").socialLinks(Map.of("github", "https://github.com/awa"))
                .publicBio(open).publicLocation(open).publicLinks(open).build();
    }

    @Test
    @DisplayName("bio, city and links stay hidden until the member opens them")
    void hidesWhatIsPrivate() {
        PublicProfileResponse closed = PublicProfileResponse.of(new PublicProfile(member(false), List.of(), List.of()));
        PublicProfileResponse open = PublicProfileResponse.of(new PublicProfile(member(true), List.of(), List.of()));

        assertThat(closed.bio()).isNull();
        assertThat(closed.location()).isNull();
        assertThat(closed.links()).isNull();
        assertThat(open.bio()).isEqualTo("Développeuse backend");
        assertThat(open.location()).isEqualTo("Douala");
        assertThat(open.links()).containsKey("github");
        assertThat(open.name()).isEqualTo("Awa Diallo");
    }

    @Test
    @DisplayName("the public profile never carries the email or the phone")
    void neverContacts() {
        assertThat(PublicProfileResponse.class.getRecordComponents())
                .extracting(component -> component.getName())
                .doesNotContain("email", "phone");
    }
}
