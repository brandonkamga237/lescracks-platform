package com.brandonkamga.lescracks.mail.infra;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.assertj.core.api.Assertions.assertThat;

class MailServiceImplTest {

    private final MailServiceImpl mail = new MailServiceImpl(new JavaMailSenderImpl(),
            new EmailBodyRenderer("https://lescracks.com"), "https://lescracks.com/", "LesCracks <contact@lescracks.com>");

    @Test
    void wrapsTheBroadcastInTheFixedFrame() throws Exception {
        var body = new ObjectMapper().readTree("""
                [{"type": "paragraph", "text": "Bonjour {{firstName}}"}]
                """);

        String html = mail.broadcastHtml("marie@example.com", "Les <nouveautés>", body, "Marie", "Kamga");

        assertThat(html)
                .contains("src=\"https://lescracks.com/images/email-logo.png\"", "alt=\"LesCracks\"")
                .contains("Bonjour Marie")
                .contains("<title>Les &lt;nouveautés&gt;</title>")
                .contains("abonné à la newsletter LesCracks")
                .doesNotContain("{{firstName}}", "text-transform:uppercase");
    }
}
