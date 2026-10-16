package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAvatarTest {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1, 2, 3};

    @Mock private UserRepository users;
    @Mock private PasswordEncoder passwords;
    @Mock private StorageService storage;
    @Mock private TaxonomyService taxonomy;

    private UserProfileServiceImpl service;
    private User member;

    @BeforeEach
    void setUp() {
        service = new UserProfileServiceImpl(users, passwords, storage, taxonomy);
        member = User.builder().id(5L).email("awa@example.com").avatarUrl("old.jpg").build();
    }

    @Test
    @DisplayName("a new photo is stored with its real type and the previous one is deleted")
    void replacesThePhoto() {
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));
        when(storage.store("me.jpg", JPEG, "image/jpeg")).thenReturn("new.jpg");

        service.updateAvatar("awa@example.com", new MockMultipartFile("file", "me.jpg", "text/html", JPEG));

        assertThat(member.getAvatarUrl()).isEqualTo("new.jpg");
        verify(storage).delete("old.jpg");
    }

    @Test
    @DisplayName("a failed cleanup of the old photo does not undo the new one")
    void cleanupFailureIsHarmless() {
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));
        when(storage.store("me.jpg", JPEG, "image/jpeg")).thenReturn("new.jpg");
        doThrow(new IllegalStateException("minio down")).when(storage).delete("old.jpg");

        service.updateAvatar("awa@example.com", new MockMultipartFile("file", "me.jpg", "image/jpeg", JPEG));

        assertThat(member.getAvatarUrl()).isEqualTo("new.jpg");
    }

    @Test
    @DisplayName("removing the photo deletes our copy; an external photo is only forgotten")
    void removesThePhoto() {
        when(users.findByEmailIgnoreCase("awa@example.com")).thenReturn(Optional.of(member));
        service.removeAvatar("awa@example.com");
        assertThat(member.getAvatarUrl()).isNull();
        verify(storage).delete("old.jpg");

        member.setAvatarUrl("https://lh3.googleusercontent.com/a/x");
        service.removeAvatar("awa@example.com");
        verify(storage, never()).delete("https://lh3.googleusercontent.com/a/x");
    }
}
