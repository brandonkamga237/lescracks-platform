package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleBody;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.newsletter.application.ArticleNews;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.storage.domain.Upload;
import com.brandonkamga.lescracks.support.InMemoryTaxonomy;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArticleAdminServiceTest {

    private final ObjectMapper json = new ObjectMapper();
    private final InMemoryContent.Articles articles = new InMemoryContent.Articles();
    private final InMemoryContent.Engagement engagement = new InMemoryContent.Engagement();
    private final InMemoryContent.Newsletter newsletter = new InMemoryContent.Newsletter();
    private final InMemoryContent.Files files = new InMemoryContent.Files();
    private final InMemoryTaxonomy taxonomy = new InMemoryTaxonomy();

    private ArticleAdminService service;
    private Category backend;
    private Tag java;

    @BeforeEach
    void setUp() {
        ArticleViews views = new ArticleViews(taxonomy.service, engagement);
        service = new ArticleAdminServiceImpl(articles, views, taxonomy.service, files, newsletter, engagement, new ArticleBody(json), json);
        backend = taxonomy.theme("Backend");
        java = taxonomy.tag("Java");
    }

    private JsonNode body(String text) {
        return json.createObjectNode().set("blocks", json.createArrayNode().add(json.createObjectNode().put("type", "paragraph").put("text", text)));
    }

    private ArticleDraft draft(ArticleStatus status, Instant scheduledAt) {
        return new ArticleDraft("  Titre de l’article  ", "  Une description  ", "https://cdn.example/cover.png",
                backend.getId(), Set.of(java.getId()), status, body("Bonjour le monde"), scheduledAt);
    }

    private ArticleDraft draft(ArticleStatus status) {
        return draft(status, null);
    }

    @Test
    @DisplayName("publishing stores the trimmed article with its body and text, and tells the subscribers")
    void publishes() {
        ArticleView view = service.create(draft(ArticleStatus.PUBLISHED), null);

        Article stored = articles.stored(view.article().getId());
        assertThat(stored.getTitle()).isEqualTo("Titre de l’article");
        assertThat(stored.getDescription()).isEqualTo("Une description");
        assertThat(stored.getSlug()).isEqualTo("titre-de-l-article");
        assertThat(stored.getPlainText()).isEqualTo("Bonjour le monde");
        assertThat(stored.getReadingMinutes()).isEqualTo(1);
        assertThat(stored.getTagIds()).containsExactly(java.getId());
        assertThat(stored.getPublishedAt()).isNotNull();
        assertThat(view.category().getName()).isEqualTo("Backend");
        assertThat(view.tags()).containsExactly("Java");
        assertThat(newsletter.articles).containsExactly(new ArticleNews("Titre de l’article", "Une description",
                "/blog/titre-de-l-article", "https://cdn.example/cover.png"));
    }

    @Test
    @DisplayName("a draft stays quiet: nobody is notified about something they cannot read")
    void draftNotifiesNobody() {
        ArticleView view = service.create(draft(ArticleStatus.DRAFT), null);

        assertThat(articles.stored(view.article().getId()).getStatus()).isEqualTo(ArticleStatus.DRAFT);
        assertThat(newsletter.articles).isEmpty();
    }

    @Test
    @DisplayName("a title already taken gets a numeric suffix, never a duplicate url")
    void slugIsMadeUnique() {
        service.create(draft(ArticleStatus.DRAFT), null);

        ArticleView second = service.create(draft(ArticleStatus.DRAFT), null);

        assertThat(second.article().getSlug()).isEqualTo("titre-de-l-article-2");
    }

    @Test
    void refusesAnArticleWithNoCoverAtAll() {
        ArticleDraft noCover = new ArticleDraft("Titre", "Description", null, backend.getId(), null,
                ArticleStatus.DRAFT, body("x"), null);

        assertThatThrownBy(() -> service.create(noCover, null))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("couverture est obligatoire");
        assertThat(articles.size()).isZero();
    }

    @Test
    void refusesACoverThatIsNotAnImage() {
        Upload pdf = new Upload("cover.pdf", "application/pdf", "%PDF".getBytes());

        assertThatThrownBy(() -> service.create(draft(ArticleStatus.DRAFT), pdf))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("format image");
        assertThat(files.stored).isEmpty();
    }

    @Test
    void refusesACoverOverFiveMegabytes() {
        Upload huge = new Upload("cover.png", "image/png", new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.create(draft(ArticleStatus.DRAFT), huge))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("5 Mo");
        assertThat(files.stored).isEmpty();
    }

    @Test
    @DisplayName("an uploaded cover is stored and wins over the URL in the form")
    void storesTheUploadedCover() {
        ArticleView view = service.create(draft(ArticleStatus.DRAFT), new Upload("cover.png", "image/png", new byte[] {1, 2}));

        assertThat(articles.stored(view.article().getId()).getCoverImage()).isEqualTo("/api/files/key-1-cover.png");
    }

    @Test
    void refusesATagThatDoesNotExist() {
        ArticleDraft unknownTag = new ArticleDraft("Titre", "Description", "https://cdn/x.png", backend.getId(), Set.of(404L),
                ArticleStatus.DRAFT, body("x"), null);

        assertThatThrownBy(() -> service.create(unknownTag, null)).isInstanceOf(BadRequestException.class);
        assertThat(articles.size()).isZero();
    }

    @Test
    @DisplayName("deleting drops the cover we host and every view, like and comment of the article")
    void deleteRemovesOurFilesAndTheAudience() {
        Long id = service.create(draft(ArticleStatus.DRAFT), new Upload("cover.png", "image/png", new byte[] {1})).article().getId();

        service.delete(id);

        assertThat(articles.findById(id)).isEmpty();
        assertThat(files.deleted).containsExactly("key-1-cover.png");
        assertThat(engagement.forgotten).containsExactly(Target.article(id));
    }

    @Test
    void deleteLeavesAnExternalCoverAlone() {
        Long id = service.create(draft(ArticleStatus.DRAFT), null).article().getId();

        service.delete(id);

        assertThat(files.deleted).isEmpty();
    }

    @Nested
    @DisplayName("scheduled publication")
    class Scheduling {

        private final Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);

        @Test
        @DisplayName("a scheduled article waits as a draft, even if the form said publish, and nobody is notified yet")
        void scheduledStaysDraft() {
            Article stored = articles.stored(service.create(draft(ArticleStatus.PUBLISHED, tomorrow), null).article().getId());

            assertThat(stored.getStatus()).isEqualTo(ArticleStatus.DRAFT);
            assertThat(stored.getScheduledAt()).isEqualTo(tomorrow);
            assertThat(stored.getPublishedAt()).isNull();
            assertThat(newsletter.articles).isEmpty();
        }

        @Test
        @DisplayName("a date in the past is refused")
        void pastDateRefused() {
            assertThatThrownBy(() -> service.create(draft(ArticleStatus.DRAFT, Instant.now().minus(1, ChronoUnit.HOURS)), null))
                    .isInstanceOf(BadRequestException.class).hasMessageContaining("futur");
        }

        @Test
        @DisplayName("saving the form again keeps a date that has just passed, instead of refusing it")
        void keepsTheStoredDateEvenIfJustPassed() {
            Instant justPassed = Instant.now().minusSeconds(5);
            Article draft = articles.save(Article.builder().title("Titre").description("D").slug("titre").coverImage("https://cdn/x.png")
                    .categoryId(backend.getId()).scheduledAt(justPassed).body(body("x")).build());

            service.update(draft.getId(), draft(ArticleStatus.DRAFT, justPassed), null);

            assertThat(articles.stored(draft.getId()).getScheduledAt()).isEqualTo(justPassed);
            assertThat(articles.stored(draft.getId()).getStatus()).isEqualTo(ArticleStatus.DRAFT);
        }
    }
}
