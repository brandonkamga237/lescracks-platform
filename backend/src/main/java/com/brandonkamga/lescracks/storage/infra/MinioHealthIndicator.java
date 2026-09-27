package com.brandonkamga.lescracks.storage.infra;

import com.brandonkamga.lescracks.storage.domain.StorageService;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Reports object storage as a first-class health dependency: a backend that cannot
 * reach its bucket can serve reads but will fail every upload, which is DOWN, not UP.
 */
@Component("storage")
public class MinioHealthIndicator implements HealthIndicator {

    private final StorageService storage;

    public MinioHealthIndicator(StorageService storage) {
        this.storage = storage;
    }

    @Override
    public Health health() {
        return storage.reachable() ? Health.up().build() : Health.down().build();
    }
}
