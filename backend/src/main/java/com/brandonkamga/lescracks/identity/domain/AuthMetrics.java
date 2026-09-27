package com.brandonkamga.lescracks.identity.domain;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/**
 * Business counters for the auth funnel: who logs in, through which provider, and how
 * often it fails. Answers in Prometheus what "users can't sign in" would otherwise
 * require digging through logs.
 */
@Component
public class AuthMetrics {

    private final MeterRegistry registry;

    public AuthMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void login(String audience, String provider, boolean success) {
        registry.counter("auth_login_total",
                "audience", audience,
                "provider", provider,
                "outcome", success ? "success" : "failure").increment();
    }

    public void register(boolean success) {
        registry.counter("auth_register_total", "outcome", success ? "success" : "failure").increment();
    }
}
