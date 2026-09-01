package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.service.interfaces.StorageService;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.ErrorResponseException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class MinioStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);

    private final String bucket;
    private final MinioClient client;

    public MinioStorageService(
            @Value("${app.minio.url}") String url,
            @Value("${app.minio.access-key}") String accessKey,
            @Value("${app.minio.secret-key}") String secretKey,
            @Value("${app.minio.bucket}") String bucket) {
        this.bucket = bucket;
        this.client = MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
    }

    /**
     * A missing bucket makes every upload fail at the first attempt rather than at startup,
     * which is a much harder failure to read from a support ticket.
     */
    @PostConstruct
    void ensureBucketExists() {
        try {
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Created MinIO bucket {}", bucket);
            }
        } catch (Exception e) {
            log.error("MinIO is unreachable, uploads will fail: {}", e.getMessage());
        }
    }

    @Override
    public String store(String originalFileName, byte[] bytes, String contentType) {
        String key = UUID.randomUUID() + extensionOf(originalFileName);
        try (InputStream stream = new ByteArrayInputStream(bytes)) {
            client.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(stream, bytes.length, -1)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build());
            return key;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to store " + originalFileName, e);
        }
    }

    @Override
    public Optional<StoredObject> read(String key) {
        try {
            StatObjectResponse stat = client.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(key).build());
            try (InputStream stream = client.getObject(
                    GetObjectArgs.builder().bucket(bucket).object(key).build())) {
                return Optional.of(new StoredObject(stream.readAllBytes(), stat.contentType(), stat.size()));
            }
        } catch (ErrorResponseException notFound) {
            return Optional.empty();
        } catch (Exception e) {
            log.error("Failed to read {} from MinIO: {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        try {
            client.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception e) {
            log.error("Failed to delete {} from MinIO: {}", key, e.getMessage());
        }
    }

    private String extensionOf(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 ? fileName.substring(dot).toLowerCase(Locale.ROOT) : "";
    }
}
