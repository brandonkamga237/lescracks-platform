package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.service.interfaces.StorageService;
import io.minio.*;
import io.minio.errors.ErrorResponseException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class MinioStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);

    private final MinioClient client;
    private final String bucket;

    public MinioStorageService(@Value("${app.minio.url}") String url,
                               @Value("${app.minio.access-key}") String accessKey,
                               @Value("${app.minio.secret-key}") String secretKey,
                               @Value("${app.minio.bucket}") String bucket) {
        this.bucket = bucket;
        this.client = MinioClient.builder().endpoint(url).credentials(accessKey, secretKey).build();
    }

    /** A missing bucket should fail at boot, not at whichever upload happens to be first. */
    @PostConstruct
    void ensureBucket() {
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created bucket {}", bucket);
            }
        } catch (Exception unreachable) {
            log.error("Object storage is unreachable, uploads will fail: {}", unreachable.getMessage());
        }
    }

    @Override
    public String store(String originalName, byte[] content, String contentType) {
        String key = UUID.randomUUID() + extensionOf(originalName);
        try (var stream = new ByteArrayInputStream(content)) {
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket).object(key)
                    .stream(stream, content.length, -1)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build());
            return key;
        } catch (Exception failed) {
            throw new IllegalStateException("Could not store " + originalName, failed);
        }
    }

    @Override
    public Optional<StoredObject> read(String key) {
        try {
            StatObjectResponse stat = client.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(key).build());
            var content = client.getObject(GetObjectArgs.builder().bucket(bucket).object(key).build());
            return Optional.of(new StoredObject(content, stat.contentType(), stat.size()));
        } catch (ErrorResponseException missing) {
            return Optional.empty();
        } catch (Exception failed) {
            log.error("Could not read {}: {}", key, failed.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception failed) {
            log.error("Could not delete {}: {}", key, failed.getMessage());
        }
    }

    private String extensionOf(String name) {
        int dot = name == null ? -1 : name.lastIndexOf('.');
        return dot >= 0 ? name.substring(dot).toLowerCase(Locale.ROOT) : "";
    }
}
