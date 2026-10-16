package com.brandonkamga.lescracks.storage.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StoredFilesTest {

    @Test
    @DisplayName("a key is served under /api/files, a URL or a public path as it is, blank as nothing")
    void publicPath() {
        assertThat(StoredFiles.publicPath("a1b2.webp")).isEqualTo("/api/files/a1b2.webp");
        assertThat(StoredFiles.publicPath("https://lh3.googleusercontent.com/a/x")).isEqualTo("https://lh3.googleusercontent.com/a/x");
        assertThat(StoredFiles.publicPath("/api/files/a1b2.webp")).isEqualTo("/api/files/a1b2.webp");
        assertThat(StoredFiles.publicPath(" ")).isNull();
    }
}
