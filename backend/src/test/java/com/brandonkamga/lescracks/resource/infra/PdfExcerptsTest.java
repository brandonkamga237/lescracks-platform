package com.brandonkamga.lescracks.resource.infra;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class PdfExcerptsTest {

    private final PdfExcerpts excerpts = new PdfExcerpts();

    private static byte[] pdf(int pages) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            for (int i = 0; i < pages; i++) document.addPage(new PDPage());
            document.save(out);
            return out.toByteArray();
        }
    }

    @Test
    @DisplayName("a long ebook is cut to its first pages, and the full length is reported")
    void cutsALongEbook() throws IOException {
        PdfExcerpts.Excerpt excerpt = excerpts.firstPages(new ByteArrayInputStream(pdf(25)), 10);

        assertThat(excerpt.pages()).isEqualTo(10);
        assertThat(excerpt.totalPages()).isEqualTo(25);
        try (PDDocument cut = Loader.loadPDF(excerpt.bytes())) {
            assertThat(cut.getNumberOfPages()).isEqualTo(10);
        }
    }

    @Test
    @DisplayName("a short ebook is served whole")
    void keepsAShortEbook() throws IOException {
        PdfExcerpts.Excerpt excerpt = excerpts.firstPages(new ByteArrayInputStream(pdf(3)), 10);

        assertThat(excerpt.pages()).isEqualTo(3);
        assertThat(excerpt.totalPages()).isEqualTo(3);
    }
}
