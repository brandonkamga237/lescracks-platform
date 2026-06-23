package com.brandonkamga.lescracks.security;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each key (typically IP + endpoint) is allowed a configurable number of
 * requests within a configurable time window. Exceeded callers receive false.
 *
 * State is cleaned up every 30 minutes to avoid unbounded growth.
 * For multi-instance deployments, replace with a Redis-backed implementation.
 */
@Service
public class RateLimiterService {

    public enum Limit {
        LOGIN(10, 5 * 60_000L),           // 10 attempts per 5 minutes
        REGISTER(5, 60 * 60_000L),        // 5 registrations per hour
        FORGOT_PASSWORD(3, 10 * 60_000L); // 3 requests per 10 minutes

        final int maxAttempts;
        final long windowMs;

        Limit(int maxAttempts, long windowMs) {
            this.maxAttempts = maxAttempts;
            this.windowMs    = windowMs;
        }
    }

    private record Bucket(AtomicInteger count, long windowStart) {}

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor(
            r -> { Thread t = new Thread(r, "rate-limiter-cleaner"); t.setDaemon(true); return t; }
    );

    @PostConstruct
    public void startCleanup() {
        cleaner.scheduleAtFixedRate(this::removeStaleEntries, 30, 30, TimeUnit.MINUTES);
    }

    /**
     * Check whether the given key is within its allowed rate for the supplied limit.
     *
     * @param key   composite key, e.g. "LOGIN:192.168.1.1"
     * @param limit the rate-limit policy to apply
     * @return true if the request is within the allowed rate, false if the limit is exceeded
     */
    public boolean isAllowed(String key, Limit limit) {
        long now = System.currentTimeMillis();
        Bucket bucket = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.windowStart() > limit.windowMs) {
                return new Bucket(new AtomicInteger(1), now);
            }
            existing.count().incrementAndGet();
            return existing;
        });
        return bucket.count().get() <= limit.maxAttempts;
    }

    /** Reset the counter for a key (e.g. after a successful login). */
    public void reset(String key) {
        buckets.remove(key);
    }

    private void removeStaleEntries() {
        long now = System.currentTimeMillis();
        // Keep the most permissive window as the max TTL for cleanup
        long maxWindow = Long.MAX_VALUE;
        for (Limit l : Limit.values()) {
            maxWindow = Math.min(maxWindow, l.windowMs);
        }
        final long threshold = now - maxWindow;
        buckets.entrySet().removeIf(e -> e.getValue().windowStart() < threshold);
    }

    @PreDestroy
    public void shutdown() {
        cleaner.shutdownNow();
    }
}
