package com.brandonkamga.lescracks.storage.infra;

import com.brandonkamga.lescracks.storage.domain.StorageService.StoredObject;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.utility.DockerImageName;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The MinIO client against a real MinIO. Photos and covers only go through this adapter, and a
 * client upgrade that compiles can still fail on the wire (MinIO 9 changed its HTTP stack), so
 * the round trip is checked here rather than discovered on the first upload in production.
 */
class MinioStorageServiceIT {

    // MinIO stopped publishing free images (minio/minio and quay.io/minio/minio both refuse
    // anonymous pulls); pgsty/minio is the community build of the same server, pinned here.
    private static final MinIOContainer MINIO = new MinIOContainer(
            DockerImageName.parse("pgsty/minio:RELEASE.2026-06-18T00-00-00Z").asCompatibleSubstituteFor("minio/minio"));

    private static MinioStorageService storage;

    @BeforeAll
    static void start() {
        MINIO.start();
        storage = new MinioStorageService(MINIO.getS3URL(), MINIO.getUserName(), MINIO.getPassword(), "lescracks-test");
        storage.ensureBucket();
    }

    @AfterAll
    static void stop() {
        MINIO.stop();
    }

    @Test
    @DisplayName("a stored file reads back with its bytes, type and size, and is gone once deleted")
    void roundTrip() throws Exception {
        byte[] content = "une photo".getBytes(StandardCharsets.UTF_8);

        String key = storage.store("Photo.WEBP", content, "image/webp");
        Optional<StoredObject> stored = storage.read(key);

        assertThat(key).endsWith(".webp");
        assertThat(stored).isPresent();
        try (var stream = stored.get().content()) {
            assertThat(stream.readAllBytes()).isEqualTo(content);
        }
        assertThat(stored.get().contentType()).isEqualTo("image/webp");
        assertThat(stored.get().size()).isEqualTo(content.length);

        storage.delete(key);
        assertThat(storage.read(key)).isEmpty();
    }

    @Test
    @DisplayName("the bucket created at boot answers the health check")
    void reachable() {
        assertThat(storage.reachable()).isTrue();
    }
}
