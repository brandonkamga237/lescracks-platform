package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.Attestation;
import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventKind;
import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.domain.Participation;
import com.brandonkamga.lescracks.domain.ParticipationStatus;
import com.brandonkamga.lescracks.domain.ResourceArticle;
import com.brandonkamga.lescracks.domain.ResourceEbook;
import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.domain.ResourceVideo;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.event.EventPhase;
import com.brandonkamga.lescracks.dto.participation.AttestationResponse;
import com.brandonkamga.lescracks.dto.participation.ParticipationResponse;
import com.brandonkamga.lescracks.dto.resource.ResourceDetail;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * What the API hands out.
 *
 * Mappers are the boundary between what is stored and what is published, so most of what
 * matters here is what does NOT come out: a Keycloak subject, an applicant's email on a
 * public attestation, a storage key. Field copying is dull; a leak is not.
 */
class MapperTest {

    private final MediaService media = mock(MediaService.class);
    private final MediaMapper mediaMapper = new MediaMapper(media);
    private final TaxonomyMapper taxonomyMapper = new TaxonomyMapper();

    private static Category category(long id, String name) {
        return Category.builder().id(id).name(name).build();
    }

    private static Tag tag(long id, String name, Category category) {
        return Tag.builder().id(id).name(name).category(category).build();
    }

    @Nested
    @DisplayName("Media")
    class MediaMapping {

        @Test
        @DisplayName("a stored image becomes a url the browser can fetch")
        void buildsAUrl() {
            when(media.urlFor(any())).thenReturn("https://cdn.lescracks.com/a.png");
            Media stored = Media.builder().id(7L).width(800).height(600).originalName("a.png").build();

            var response = mediaMapper.toResponse(stored);

            assertThat(response.url()).isEqualTo("https://cdn.lescracks.com/a.png");
            assertThat(response.width()).isEqualTo(800);
        }

        @Test
        @DisplayName("no cover means no object, not an empty one")
        void nullInNullOut() {
            assertThat(mediaMapper.toResponse(null)).isNull();
        }
    }

    @Nested
    @DisplayName("Taxonomy")
    class TaxonomyMapping {

        @Test
        @DisplayName("a tag travels with its category, or it is unreadable in a filter list")
        void tagCarriesItsCategory() {
            var response = taxonomyMapper.toResponse(tag(2L, "Spring", category(1L, "Backend")));

            assertThat(response.categoryId()).isEqualTo(1L);
            assertThat(response.categoryName()).isEqualTo("Backend");
        }
    }

    @Nested
    @DisplayName("User")
    class UserMapping {

        @Test
        @DisplayName("the Keycloak subject never leaves the server")
        void neverExposesTheSubject() {
            var response = new UserMapper(mediaMapper).toResponse(User.builder()
                    .id(1L).subject("kc-secret-42").email("ada@lescracks.test")
                    .displayName("Ada").createdAt(Instant.now()).build());

            assertThat(response.toString()).doesNotContain("kc-secret-42");
            assertThat(response.displayName()).isEqualTo("Ada");
        }
    }

    @Nested
    @DisplayName("Event")
    class EventMapping {

        private final EventMapper mapper = new EventMapper(mediaMapper);

        private Event at(long daysFromNow, Long endOffset, boolean published) {
            return Event.builder()
                    .id(1L).kind(EventKind.BOOTCAMP).slug("b").title("Bootcamp")
                    .startsAt(Instant.now().plus(daysFromNow, ChronoUnit.DAYS))
                    .endsAt(endOffset == null ? null : Instant.now().plus(endOffset, ChronoUnit.DAYS))
                    .published(published)
                    .build();
        }

        @Test
        @DisplayName("the phase is derived from the dates, never stored")
        void derivesThePhase() {
            assertThat(mapper.toSummary(at(3, 5L, true)).phase()).isEqualTo(EventPhase.UPCOMING);
            assertThat(mapper.toSummary(at(-1, 1L, true)).phase()).isEqualTo(EventPhase.RUNNING);
            assertThat(mapper.toSummary(at(-5, -3L, true)).phase()).isEqualTo(EventPhase.PAST);
        }

        @Test
        @DisplayName("registration is open only on a published event still to come")
        void computesWhetherApplicationsAreAccepted() {
            assertThat(mapper.toDetail(at(3, 5L, true)).acceptingApplications()).isTrue();
            assertThat(mapper.toDetail(at(3, 5L, false)).acceptingApplications()).isFalse();
            assertThat(mapper.toDetail(at(-5, -3L, true)).acceptingApplications()).isFalse();
        }
    }

    @Nested
    @DisplayName("Resource")
    class ResourceMapping {

        private final ResourceMapper mapper =
                new ResourceMapper(mediaMapper, taxonomyMapper, new ObjectMapper(), "/api/resources/download");

        private final Category backend = category(1L, "Backend");

        private ResourceVideo video() {
            ResourceVideo video = new ResourceVideo();
            video.setId(1L);
            video.setSlug("v");
            video.setTitle("Une vidéo");
            video.setCategory(backend);
            video.setCreatedAt(Instant.now());
            video.setExternalUrl("https://youtube.com/watch?v=1");
            video.setDurationSeconds(600);
            return video;
        }

        @Test
        @DisplayName("a video carries its link and nothing belonging to the other two kinds")
        void videoCarriesOnlyItsOwnPart() {
            ResourceDetail detail = mapper.toDetail(video());

            assertThat(detail.kind()).isEqualTo(ResourceKind.VIDEO);
            assertThat(detail.video().externalUrl()).isEqualTo("https://youtube.com/watch?v=1");
            assertThat(detail.ebook()).isNull();
            assertThat(detail.article()).isNull();
        }

        @Test
        @DisplayName("an ebook is handed a download route, never its storage key")
        void ebookHidesItsStorageKey() {
            ResourceEbook ebook = new ResourceEbook();
            ebook.setId(4L);
            ebook.setSlug("e");
            ebook.setTitle("Un guide");
            ebook.setCategory(backend);
            ebook.setCreatedAt(Instant.now());
            ebook.setFileKey("ebooks/secret-path-9f2.pdf");
            ebook.setContentType("application/pdf");
            ebook.setOriginalName("guide.pdf");
            ebook.setSizeBytes(2048L);

            ResourceDetail detail = mapper.toDetail(ebook);

            assertThat(detail.ebook().downloadUrl()).isEqualTo("/api/resources/download/4");
            assertThat(detail.toString()).doesNotContain("secret-path-9f2");
        }

        @Test
        @DisplayName("an article's body is parsed into json, not handed over as a string")
        void articleBodyIsParsed() {
            ResourceDetail detail = mapper.toDetail(article("{\"type\":\"doc\",\"content\":[]}"));

            assertThat(detail.article().body()).isNotNull();
            assertThat(detail.article().body().get("type").asText()).isEqualTo("doc");
        }

        @Test
        @DisplayName("an unreadable body drops out rather than taking the page down")
        void malformedArticleBodyDegrades() {
            ResourceDetail detail = mapper.toDetail(article("{ pas du json"));

            // A stored-data fault is ours, not the reader's: they still get the article.
            assertThat(detail.article().body()).isNull();
            assertThat(detail.title()).isEqualTo("Un article");
        }

        @Test
        @DisplayName("the catalogue says what each kind costs, in the unit that fits it")
        void summaryCarriesTheEffort() {
            // A beginner asks "what can I do tonight in twenty minutes", not "give me DevOps".
            assertThat(mapper.toSummary(video()).minutes()).isEqualTo(10);
            assertThat(mapper.toSummary(video()).pages()).isNull();

            ResourceArticle written = article("{\"type\":\"doc\"}");
            written.setReadingMinutes(7);
            assertThat(mapper.toSummary(written).minutes()).isEqualTo(7);

            ResourceEbook book = new ResourceEbook();
            book.setId(4L);
            book.setSlug("e");
            book.setTitle("Un guide");
            book.setCategory(backend);
            book.setCreatedAt(Instant.now());
            book.setPageCount(120);
            assertThat(mapper.toSummary(book).pages()).isEqualTo(120);
            assertThat(mapper.toSummary(book).minutes()).isNull();
        }

        @Test
        @DisplayName("a part-minute is rounded up: it still costs somebody that minute")
        void roundsPartMinutesUp() {
            ResourceVideo short_ = video();
            short_.setDurationSeconds(90);

            assertThat(mapper.toSummary(short_).minutes()).isEqualTo(2);
        }

        @Test
        @DisplayName("a video of unknown length says nothing rather than claiming zero")
        void unknownDurationStaysUnknown() {
            ResourceVideo unknown = video();
            unknown.setDurationSeconds(null);

            assertThat(mapper.toSummary(unknown).minutes()).isNull();
        }

        @Test
        @DisplayName("tags come out in a stable alphabetical order, whatever the set gave")
        void tagsAreSorted() {
            ResourceVideo video = video();
            Set<Tag> unordered = new LinkedHashSet<>(List.of(
                    tag(3L, "spring", backend), tag(1L, "Docker", backend), tag(2L, "Ansible", backend)));
            video.setTags(unordered);

            assertThat(mapper.toSummary(video).tags())
                    .extracting("name")
                    .containsExactly("Ansible", "Docker", "spring");
        }

        private ResourceArticle article(String body) {
            ResourceArticle article = new ResourceArticle();
            article.setId(2L);
            article.setSlug("a");
            article.setTitle("Un article");
            article.setCategory(backend);
            article.setCreatedAt(Instant.now());
            article.setBody(body);
            article.setBodyText("texte");
            article.setReadingMinutes(3);
            return article;
        }
    }

    @Nested
    @DisplayName("Application")
    class ApplicationMapping {

        private final ApplicationMapper mapper = new ApplicationMapper();

        @Test
        @DisplayName("an admin is told whether an account exists, before they click accept")
        void reportsWhetherAnAccountExists() {
            Application orphan = Application.builder()
                    .id(1L).target(EnrolmentTarget.MENTORSHIP).fullName("Ada")
                    .email("ada@lescracks.test").status(ApplicationStatus.PENDING).build();

            assertThat(mapper.toResponse(orphan).hasAccount()).isFalse();

            orphan.setUser(User.builder().id(9L).build());
            assertThat(mapper.toResponse(orphan).hasAccount()).isTrue();
        }

        @Test
        @DisplayName("a 360 application reports no event rather than a placeholder")
        void mentorshipApplicationHasNoEvent() {
            var response = mapper.toResponse(Application.builder()
                    .id(1L).target(EnrolmentTarget.MENTORSHIP).fullName("Ada")
                    .email("ada@lescracks.test").status(ApplicationStatus.PENDING).build());

            assertThat(response.eventId()).isNull();
            assertThat(response.eventTitle()).isNull();
        }
    }

    @Nested
    @DisplayName("Participation")
    class ParticipationMapping {

        private final ParticipationMapper mapper = new ParticipationMapper();

        private Participation ofAda() {
            return Participation.builder()
                    .id(1L)
                    .user(User.builder().id(9L).displayName("Ada Lovelace")
                            .email("ada@lescracks.test").subject("kc-9").build())
                    .target(EnrolmentTarget.MENTORSHIP)
                    .status(ParticipationStatus.COMPLETED)
                    .startedAt(LocalDate.of(2026, 1, 5))
                    .completedAt(LocalDate.of(2026, 6, 1))
                    .build();
        }

        @Test
        @DisplayName("the back office sees whose participation it is")
        void adminViewNamesTheHolder() {
            ParticipationResponse response = mapper.toResponse(ofAda());

            assertThat(response.userId()).isEqualTo(9L);
            assertThat(response.userName()).isEqualTo("Ada Lovelace");
        }

        @Test
        @DisplayName("someone reading their own is not told their own name back")
        void ownViewDropsTheHolder() {
            ParticipationResponse response = mapper.toOwnResponse(ofAda());

            assertThat(response.userId()).isNull();
            assertThat(response.userName()).isNull();
            assertThat(response.programme()).isEqualTo("Accompagnement 360");
        }

        @Test
        @DisplayName("a public attestation names the person and nothing that identifies them")
        void publicAttestationLeaksNothing() {
            Participation participation = ofAda();
            Attestation attestation = Attestation.builder()
                    .code("LC-2026-AB12CD").participation(participation).issuedAt(Instant.now()).build();

            AttestationResponse response = mapper.toResponse(attestation);

            // Whoever holds the code can read this, so it must be safe for them to.
            assertThat(response.holderName()).isEqualTo("Ada Lovelace");
            assertThat(response.toString())
                    .doesNotContain("ada@lescracks.test", "kc-9")
                    .contains("LC-2026-AB12CD");
        }

        @Test
        @DisplayName("a participation with no attestation reports none")
        void noAttestationMeansNull() {
            assertThat(mapper.toResponse(ofAda()).attestationCode()).isNull();
        }

        @Test
        @DisplayName("the public counters are read straight from the service's tally")
        void proofOfWorkCarriesTheCounters() {
            var proof = mapper.toProofOfWork(Map.of(
                    "peopleHelped", 12L, "completed", 8L, "inProgress", 4L,
                    "byProgramme", Map.of("MENTORSHIP", 5L, "EVENT", 3L)));

            assertThat(proof.peopleHelped()).isEqualTo(12L);
            assertThat(proof.byProgramme()).containsEntry("MENTORSHIP", 5L);
        }
    }
}
