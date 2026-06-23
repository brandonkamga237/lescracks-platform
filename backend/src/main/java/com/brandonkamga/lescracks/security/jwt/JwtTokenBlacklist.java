package com.brandonkamga.lescracks.security.jwt;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * In-memory JWT token blacklist.
 * Revoked JTIs are stored with their expiration timestamp so the map
 * never grows unbounded — expired entries are pruned every hour.
 *
 * NOTE: This implementation is suitable for single-instance deployments.
 * For multi-instance deployments, replace with a shared store (Redis).
 */
@Component
public class JwtTokenBlacklist {

    private final ConcurrentHashMap<String, Long> revokedTokens = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor(
            r -> { Thread t = new Thread(r, "jwt-blacklist-cleaner"); t.setDaemon(true); return t; }
    );

    @PostConstruct
    public void startCleanup() {
        cleaner.scheduleAtFixedRate(this::removeExpiredEntries, 1, 1, TimeUnit.HOURS);
    }

    /**
     * Revoke a token by its JTI until its natural expiration time.
     *
     * @param jti           the JWT ID claim value
     * @param expirationMs  absolute expiration time in epoch milliseconds
     */
    public void revoke(String jti, long expirationMs) {
        revokedTokens.put(jti, expirationMs);
    }

    /**
     * Returns true if the given JTI has been explicitly revoked and has not yet expired.
     */
    public boolean isRevoked(String jti) {
        Long expirationMs = revokedTokens.get(jti);
        if (expirationMs == null) {
            return false;
        }
        if (System.currentTimeMillis() > expirationMs) {
            revokedTokens.remove(jti);
            return false;
        }
        return true;
    }

    private void removeExpiredEntries() {
        long now = System.currentTimeMillis();
        revokedTokens.entrySet().removeIf(entry -> now > entry.getValue());
    }

    @PreDestroy
    public void shutdown() {
        cleaner.shutdownNow();
    }
}
