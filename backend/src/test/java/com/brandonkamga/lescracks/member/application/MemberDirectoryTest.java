package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountDirectoryImpl;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.account.application.InMemoryAccountStore;
import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.assertj.core.api.Assertions.assertThat;

class MemberDirectoryTest {

    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    private final InMemoryMemberProfileStore profiles = new InMemoryMemberProfileStore();
    private final MemberDirectoryImpl directory = new MemberDirectoryImpl(new AccountDirectoryImpl(accounts, mock(AccountEvents.class)), profiles);

    @Test
    @DisplayName("a member joins the account and the profile; one without a profile still comes back")
    void joinsAccountAndProfile() {
        Long withProfile = accounts.save(Account.builder().email("a@example.com").firstName("Awa").passwordHash("h").build()).getId();
        Long without = accounts.save(Account.builder().email("b@example.com").firstName("Kofi").status(AccountStatus.BANNED).passwordHash("h").build()).getId();
        profiles.save(MemberProfile.builder().accountId(withProfile).avatarUrl("a.jpg").bio("Dev").publicBio(true).build());

        Map<Long, Member> members = directory.findAll(List.of(withProfile, without, 404L));

        assertThat(members).containsOnlyKeys(withProfile, without);
        assertThat(members.get(withProfile).getAvatarUrl()).isEqualTo("a.jpg");
        assertThat(members.get(withProfile).isPublicBio()).isTrue();
        assertThat(members.get(without).getFirstName()).isEqualTo("Kofi");
        assertThat(members.get(without).isActive()).isFalse();
    }
}
