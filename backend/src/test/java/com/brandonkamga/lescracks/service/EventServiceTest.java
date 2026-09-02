package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.service.impl.EventServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.EventService.EventDraft;
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
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Bootcamps and workshops.
 *
 * The rule worth pinning down is the slug: it is generated once and never recomputed, so a
 * link somebody shared keeps working after the title is corrected. Everything else is
 * refusing bad dates early, in words, rather than letting a constraint say it later.
 */
@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    EventRepository events;

    @Mock
    MediaService media;

    @InjectMocks
    EventServiceImpl service;

    private static Instant days(long offset) {
        return Instant.now().plus(offset, ChronoUnit.DAYS);
    }

    private static EventDraft draft(String title, Instant startsAt, Instant endsAt) {
        return new EventDraft(EventKind.BOOTCAMP, title, "Résumé", "Description",
                startsAt, endsAt, "Douala", 20, null);
    }

    private static EventDraft valid() {
        return draft("Bootcamp Spring", days(10), days(12));
    }

    @Test
    @DisplayName("a new event gets a slug derived from its title")
    void derivesTheSlug() {
        when(events.existsBySlug(anyString())).thenReturn(false);
        when(events.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThat(service.create(draft("Réussir son entretien !", days(5), null)).getSlug())
                .isEqualTo("reussir-son-entretien");
    }

    @Test
    @DisplayName("a title already taken gets a numbered slug rather than colliding")
    void suffixesATakenSlug() {
        when(events.existsBySlug("bootcamp-spring")).thenReturn(true);
        when(events.existsBySlug("bootcamp-spring-2")).thenReturn(false);
        when(events.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThat(service.create(valid()).getSlug()).isEqualTo("bootcamp-spring-2");
    }

    @Test
    @DisplayName("correcting a title never moves the slug")
    void updateKeepsTheSlug() {
        Event existing = Event.builder().id(1L).slug("bootcamp-spring").kind(EventKind.BOOTCAMP)
                .title("Bootcamp Spring").startsAt(days(10)).build();
        when(events.findById(1L)).thenReturn(Optional.of(existing));

        Event updated = service.update(1L, draft("Bootcamp Spring Boot corrigé", days(10), days(12)));

        // A shared link outlives a typo.
        assertThat(updated.getSlug()).isEqualTo("bootcamp-spring");
        assertThat(updated.getTitle()).isEqualTo("Bootcamp Spring Boot corrigé");
    }

    @Test
    @DisplayName("a title is trimmed on the way in")
    void trimsTheTitle() {
        when(events.existsBySlug(anyString())).thenReturn(false);
        when(events.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThat(service.create(draft("  Bootcamp Spring  ", days(5), null)).getTitle())
                .isEqualTo("Bootcamp Spring");
    }

    @Test
    @DisplayName("an event with no kind is refused")
    void refusesAMissingKind() {
        EventDraft noKind = new EventDraft(null, "T", null, null, days(5), null, null, null, null);

        assertThatThrownBy(() -> service.create(noKind))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("bootcamp ou d'un workshop");
        verify(events, never()).save(any());
    }

    @Test
    @DisplayName("an event with no title is refused")
    void refusesAMissingTitle() {
        assertThatThrownBy(() -> service.create(draft("   ", days(5), null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("titre");
    }

    @Test
    @DisplayName("an event with no start date is refused: the start is what makes it an event")
    void refusesAMissingStart() {
        assertThatThrownBy(() -> service.create(draft("Bootcamp", null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("date de début");
    }

    @Test
    @DisplayName("an end before the start is refused")
    void refusesAnEndBeforeTheStart() {
        assertThatThrownBy(() -> service.create(draft("Bootcamp", days(10), days(5))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ne peut pas précéder");
    }

    @Test
    @DisplayName("no end date at all is fine: only the start is required")
    void allowsAnOpenEndedEvent() {
        when(events.existsBySlug(anyString())).thenReturn(false);
        when(events.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThatCode(() -> service.create(draft("Bootcamp", days(10), null)))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("a capacity of zero or less is refused; empty means unlimited")
    void refusesANonPositiveCapacity() {
        EventDraft zero = new EventDraft(EventKind.BOOTCAMP, "T", null, null, days(5), null, null, 0, null);

        assertThatThrownBy(() -> service.create(zero))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("supérieure à zéro");
    }

    @Test
    @DisplayName("a cover is resolved through the media service, never trusted as an id")
    void resolvesTheCover() {
        Media cover = Media.builder().id(9L).build();
        when(events.existsBySlug(anyString())).thenReturn(false);
        when(events.save(any())).thenAnswer(call -> call.getArgument(0));
        when(media.require(9L)).thenReturn(cover);

        EventDraft withCover = new EventDraft(EventKind.WORKSHOP, "Atelier", null, null,
                days(5), null, null, null, 9L);

        assertThat(service.create(withCover).getCover()).isEqualTo(cover);
    }

    @Test
    @DisplayName("removing the cover clears it rather than leaving the old one")
    void clearsTheCoverWhenNoneIsGiven() {
        Event existing = Event.builder().id(1L).slug("b").kind(EventKind.BOOTCAMP)
                .title("B").startsAt(days(10)).cover(Media.builder().id(9L).build()).build();
        when(events.findById(1L)).thenReturn(Optional.of(existing));

        assertThat(service.update(1L, valid()).getCover()).isNull();
        verify(media, never()).require(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    @DisplayName("publishing is its own act, separate from editing")
    void publishingIsSeparate() {
        Event existing = Event.builder().id(1L).slug("b").kind(EventKind.BOOTCAMP)
                .title("B").startsAt(days(10)).published(false).build();
        when(events.findById(1L)).thenReturn(Optional.of(existing));

        assertThat(service.setPublished(1L, true).isPublished()).isTrue();
        assertThat(service.setPublished(1L, false).isPublished()).isFalse();
    }

    @Test
    @DisplayName("editing a published event does not unpublish it")
    void updatingDoesNotChangeVisibility() {
        Event existing = Event.builder().id(1L).slug("b").kind(EventKind.BOOTCAMP)
                .title("B").startsAt(days(10)).published(true).build();
        when(events.findById(1L)).thenReturn(Optional.of(existing));

        assertThat(service.update(1L, valid()).isPublished()).isTrue();
    }

    @Test
    @DisplayName("an event that does not exist is not found")
    void refusesUnknownEvents() {
        when(events.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.require(999L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.delete(999L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.setPublished(999L, true)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a slug that does not exist is not found either")
    void refusesAnUnknownSlug() {
        when(events.findBySlug("absent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireBySlug("absent")).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("deleting removes the event that was asked for")
    void deletesTheEvent() {
        Event existing = Event.builder().id(1L).build();
        when(events.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(events).delete(existing);
    }
}
