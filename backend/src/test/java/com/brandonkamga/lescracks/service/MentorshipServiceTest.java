package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.domain.Mentorship;
import com.brandonkamga.lescracks.repository.MentorshipRepository;
import com.brandonkamga.lescracks.service.impl.MentorshipServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A single row that says whether the 360 takes applications.
 *
 * It has no lifecycle, unlike an event: it opens and closes on a decision, repeatedly, and
 * the whole application layer reads it before accepting anybody.
 */
@ExtendWith(MockitoExtension.class)
class MentorshipServiceTest {

    @Mock
    MentorshipRepository repository;

    @Mock
    MediaService media;

    @InjectMocks
    MentorshipServiceImpl service;

    private static Mentorship closed() {
        return Mentorship.builder()
                .id(Mentorship.SINGLETON_ID).open(false).title("Accompagnement 360")
                .updatedAt(Instant.now().minus(1, ChronoUnit.DAYS)).build();
    }

    @Test
    @DisplayName("opening flips the flag and stamps when it happened")
    void openingStampsTheChange() {
        Mentorship mentorship = closed();
        Instant before = mentorship.getUpdatedAt();
        when(repository.findById(Mentorship.SINGLETON_ID)).thenReturn(Optional.of(mentorship));

        Mentorship opened = service.setOpen(true);

        assertThat(opened.isOpen()).isTrue();
        assertThat(opened.getUpdatedAt()).isAfter(before);
    }

    @Test
    @DisplayName("setting it to what it already is changes nothing, timestamp included")
    void reopeningAnOpenProgrammeIsANoOp() {
        Mentorship mentorship = closed();
        mentorship.setOpen(true);
        Instant before = mentorship.getUpdatedAt();
        when(repository.findById(Mentorship.SINGLETON_ID)).thenReturn(Optional.of(mentorship));

        // Otherwise "last changed" would move every time an admin saved the same screen.
        assertThat(service.setOpen(true).getUpdatedAt()).isEqualTo(before);
    }

    @Test
    @DisplayName("isOpen reads the row rather than a cached answer")
    void readsTheRow() {
        Mentorship mentorship = closed();
        when(repository.findById(Mentorship.SINGLETON_ID)).thenReturn(Optional.of(mentorship));

        assertThat(service.isOpen()).isFalse();
        mentorship.setOpen(true);
        assertThat(service.isOpen()).isTrue();
    }

    @Test
    @DisplayName("updating the copy attaches the cover that was chosen")
    void updateAttachesTheCover() {
        Media cover = Media.builder().id(9L).build();
        when(repository.findById(Mentorship.SINGLETON_ID)).thenReturn(Optional.of(closed()));
        when(media.require(9L)).thenReturn(cover);

        Mentorship updated = service.update("Titre", "Résumé", "Description", 9L);

        assertThat(updated.getTitle()).isEqualTo("Titre");
        assertThat(updated.getCover()).isEqualTo(cover);
    }

    @Test
    @DisplayName("no cover chosen means the cover is removed, not left behind")
    void updateClearsTheCoverWhenNoneIsGiven() {
        Mentorship mentorship = closed();
        mentorship.setCover(Media.builder().id(9L).build());
        when(repository.findById(Mentorship.SINGLETON_ID)).thenReturn(Optional.of(mentorship));

        assertThat(service.update("Titre", null, null, null).getCover()).isNull();
        verify(media, never()).require(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    @DisplayName("a missing row means the schema was never applied, and says so")
    void missingRowIsAnInstallationFault() {
        when(repository.findById(Mentorship.SINGLETON_ID)).thenReturn(Optional.empty());

        // Not a NotFoundException: nobody asked for this row, the migration should have made it.
        assertThatThrownBy(() -> service.current())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("schema was not applied");
    }
}
