package com.brandonkamga.lescracks.stats.infra;

import com.fasterxml.jackson.databind.JsonNode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Thin client over the self-hosted Umami API, reachable only inside the
 * docker network. The admin panel consumes its data through our own stats
 * endpoints; admins never see Umami itself.
 */
@Component
public class UmamiClient {
    private static final Logger log = LoggerFactory.getLogger(UmamiClient.class);
    private static final Duration TOKEN_TTL = Duration.ofHours(12);

    private final RestClient http;
    private final String websiteId;
    private final String username;
    private final String password;
    private final boolean enabled;

    private final AtomicReference<Token> token = new AtomicReference<>();

    private record Token(String value, Instant expiresAt) {
        boolean expired() { return Instant.now().isAfter(expiresAt); }
    }

    public UmamiClient(@Value("${app.umami.base-url:}") String baseUrl,
                       @Value("${app.umami.website-id:}") String websiteId,
                       @Value("${app.umami.username:}") String username,
                       @Value("${app.umami.password:}") String password) {
        this.websiteId = websiteId;
        this.username = username;
        this.password = password;
        this.enabled = !baseUrl.isBlank() && !websiteId.isBlank()
                && !username.isBlank() && !password.isBlank();
        this.http = enabled ? RestClient.builder().baseUrl(baseUrl).build() : null;
    }

    public boolean isEnabled() { return enabled; }

    /** Umami v2: each metric comes as {value, prev} against the equivalent previous range. */
    public JsonNode stats(Instant from, Instant to) {
        return get("/api/websites/" + websiteId + "/stats", Map.of(
                "startAt", from.toEpochMilli(), "endAt", to.toEpochMilli()));
    }

    /** Daily pageview/visit series: {pageviews: [{x, y}], sessions: [{x, y}]}. */
    public JsonNode pageviews(Instant from, Instant to) {
        return get("/api/websites/" + websiteId + "/pageviews", Map.of(
                "startAt", from.toEpochMilli(), "endAt", to.toEpochMilli(),
                "unit", "day", "timezone", "UTC"));
    }

    /** Top values for a dimension (url, referrer, country...): [{x, y}]. */
    public JsonNode metrics(String type, Instant from, Instant to, int limit) {
        return get("/api/websites/" + websiteId + "/metrics", Map.of(
                "startAt", from.toEpochMilli(), "endAt", to.toEpochMilli(),
                "type", type, "limit", limit));
    }

    private JsonNode get(String path, Map<String, ?> params) {
        try {
            return fetch(path, params);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() != 401) throw e;
            token.set(null);
            return fetch(path, params);
        }
    }

    private JsonNode fetch(String path, Map<String, ?> params) {
        return http.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path(path);
                    params.forEach((k, v) -> builder.queryParam(k, v));
                    return builder.build();
                })
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearer())
                .retrieve()
                .body(JsonNode.class);
    }

    private String bearer() {
        Token current = token.get();
        if (current != null && !current.expired()) return current.value();
        JsonNode body = http.post()
                .uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("username", username, "password", password))
                .retrieve()
                .body(JsonNode.class);
        String value = body != null && body.hasNonNull("token") ? body.get("token").asText() : null;
        if (value == null) throw new IllegalStateException("Umami login returned no token");
        Token fresh = new Token(value, Instant.now().plus(TOKEN_TTL));
        token.set(fresh);
        log.debug("Umami token refreshed");
        return fresh.value();
    }
}
