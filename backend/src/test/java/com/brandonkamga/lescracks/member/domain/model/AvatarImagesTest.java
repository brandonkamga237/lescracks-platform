package com.brandonkamga.lescracks.member.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvatarImagesTest {

    @Test
    @DisplayName("JPEG, PNG and WebP are recognised by their bytes")
    void recognisesPhotos() {
        assertThat(AvatarImages.check(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo("image/jpeg");
        assertThat(AvatarImages.check(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0})).isEqualTo("image/png");
        assertThat(AvatarImages.check("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1))).isEqualTo("image/webp");
    }

    @Test
    @DisplayName("an SVG or an HTML page named photo.jpg is refused")
    void refusesPagesPosingAsPhotos() {
        assertThatThrownBy(() -> AvatarImages.check("<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> AvatarImages.check("<html>".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("a photo over 5 MB is refused")
    void refusesHeavyFiles() {
        byte[] heavy = new byte[AvatarImages.MAX_BYTES + 1];
        heavy[0] = (byte) 0xFF;
        heavy[1] = (byte) 0xD8;
        heavy[2] = (byte) 0xFF;

        assertThatThrownBy(() -> AvatarImages.check(heavy)).hasMessageContaining("5 Mo");
    }
}
