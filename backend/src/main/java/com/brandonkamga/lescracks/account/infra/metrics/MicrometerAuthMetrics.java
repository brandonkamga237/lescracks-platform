package com.brandonkamga.lescracks.account.infra.metrics;

import com.brandonkamga.lescracks.account.domain.port.AuthMetrics;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

/** Read in Prometheus as auth_login_total and auth_register_total. */
@Component
public class MicrometerAuthMetrics implements AuthMetrics {

    private final MeterRegistry registry;

    public MicrometerAuthMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    @Override
    public void login(String audience, String provider, boolean success) {
        registry.counter("auth_login_total",
                "audience", audience,
                "provider", provider,
                "outcome", success ? "success" : "failure").increment();
    }

    @Override
    public void register(boolean success) {
        registry.counter("auth_register_total", "outcome", success ? "success" : "failure").increment();
    }
}
