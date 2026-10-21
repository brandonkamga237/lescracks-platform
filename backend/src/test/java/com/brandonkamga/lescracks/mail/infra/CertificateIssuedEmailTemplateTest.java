package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.CertificateIssuedEmail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CertificateIssuedEmailTemplateTest {

    @Test
    @DisplayName("the email links to the attestation by its code and escapes the holder's name")
    void linksAndEscapes() {
        var template = new CertificateIssuedEmailTemplate(new EmailLayout("https://lescracks.com"));

        var rendered = template.render(new CertificateIssuedEmail("awa@example.com", "<Awa>", "a participé au hackathon « 001 »", "ABCDEFGHJK"));

        assertThat(rendered.html()).contains("https://lescracks.com/attestations/ABCDEFGHJK").contains("&lt;Awa&gt;").doesNotContain("<Awa>");
        assertThat(rendered.text()).contains("https://lescracks.com/attestations/ABCDEFGHJK");
    }
}
