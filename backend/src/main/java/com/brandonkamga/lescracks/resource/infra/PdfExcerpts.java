package com.brandonkamga.lescracks.resource.infra;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;

/** Cuts the first pages of a PDF on the server: the preview never carries the rest of the book. */
@Component
public class PdfExcerpts {

    public record Excerpt(byte[] bytes, int pages, int totalPages) {
    }

    public Excerpt firstPages(InputStream pdf, int pages) {
        try (PDDocument source = Loader.loadPDF(new RandomAccessReadBuffer(pdf))) {
            int total = source.getNumberOfPages();
            try (PDDocument excerpt = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                for (int i = 0; i < Math.min(pages, total); i++) {
                    excerpt.importPage(source.getPage(i));
                }
                excerpt.save(out);
                return new Excerpt(out.toByteArray(), Math.min(pages, total), total);
            }
        } catch (IOException unreadable) {
            throw new UncheckedIOException("Le PDF n'a pas pu être lu.", unreadable);
        }
    }
}
