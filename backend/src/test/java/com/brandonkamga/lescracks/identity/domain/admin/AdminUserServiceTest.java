package com.brandonkamga.lescracks.identity.domain.admin;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.InMemoryUserStore;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    private final InMemoryUserStore users = new InMemoryUserStore();
    @Mock private EmailVerificationService verification;

    private AdminUserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminUserServiceImpl(users, verification);
    }

    @Test
    @DisplayName("support resends the link to a member whose address is not confirmed")
    void resends() {
        User member = users.save(User.builder().id(1L).email("awa@example.com").passwordHash("hash").build());

        service.resendVerification(1L);

        verify(verification).send(member);
    }

    @Test
    @DisplayName("an address already confirmed gets no new link")
    void alreadyConfirmed() {
        users.save(User.builder().id(2L).passwordHash("hash").emailVerified(true).build());

        assertThatThrownBy(() -> service.resendVerification(2L)).isInstanceOf(ConflictException.class);
        verify(verification, never()).send(any());
    }

    @Test
    @DisplayName("a newsletter-only contact has no account to confirm")
    void contactsHaveNoAccount() {
        users.save(User.builder().id(3L).build());

        assertThatThrownBy(() -> service.resendVerification(3L)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.markVerified(3L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("support can confirm a member's address by hand, and it stays confirmed")
    void marksVerified() {
        users.save(User.builder().id(4L).provider(AuthProvider.GITHUB).build());

        assertThat(service.markVerified(4L).isEmailVerified()).isTrue();
        assertThat(users.stored(4L).isEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("a suspended member stays suspended")
    void suspends() {
        users.save(User.builder().id(5L).passwordHash("hash").build());

        service.setStatus(5L, UserStatus.BANNED);

        assertThat(users.stored(5L).getStatus()).isEqualTo(UserStatus.BANNED);
    }
}
