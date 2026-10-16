package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock private UserRepository users;
    @Mock private EmailVerificationService verification;

    private AdminUserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminUserServiceImpl(users, verification);
    }

    private User stored(User user) {
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        return user;
    }

    @Test
    @DisplayName("support resends the link to a member whose address is not confirmed")
    void resends() {
        User member = stored(User.builder().id(1L).email("awa@example.com").passwordHash("hash").build());

        service.resendVerification(1L);

        verify(verification).send(member);
    }

    @Test
    @DisplayName("an address already confirmed gets no new link")
    void alreadyConfirmed() {
        stored(User.builder().id(2L).passwordHash("hash").emailVerified(true).build());

        assertThatThrownBy(() -> service.resendVerification(2L)).isInstanceOf(ConflictException.class);
        verify(verification, never()).send(any());
    }

    @Test
    @DisplayName("a newsletter-only contact has no account to confirm")
    void contactsHaveNoAccount() {
        stored(User.builder().id(3L).build());

        assertThatThrownBy(() -> service.resendVerification(3L)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.markVerified(3L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("support can confirm a member's address by hand")
    void marksVerified() {
        User member = stored(User.builder().id(4L).provider(AuthProvider.GITHUB).build());

        assertThat(service.markVerified(4L).isEmailVerified()).isTrue();
        assertThat(member.isEmailVerified()).isTrue();
    }
}
