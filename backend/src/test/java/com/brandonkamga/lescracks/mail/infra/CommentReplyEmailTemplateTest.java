package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.CommentReplyEmail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CommentReplyEmailTemplateTest {

    @Test
    @DisplayName("the email quotes the reply, links to the discussion and escapes what members wrote")
    void quotesAndLinks() {
        var template = new CommentReplyEmailTemplate(new EmailLayout("https://lescracks.com"));

        var rendered = template.render(new CommentReplyEmail("awa@example.com", "Awa", "<Eric>", "Docker", "Essaie <b>compose</b>",
                "/blog/docker#commentaire-10"));

        assertThat(rendered.subject()).contains("<Eric>");
        assertThat(rendered.html()).contains("https://lescracks.com/blog/docker#commentaire-10")
                .contains("&lt;Eric&gt;").contains("&lt;b&gt;compose").doesNotContain("<b>compose");
    }
}
