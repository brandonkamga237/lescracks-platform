package com.brandonkamga.lescracks.stats.infra;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Talks to a stand-in that behaves like Umami's Node server in production: a request asking to
 * upgrade to HTTP/2 gets its connection closed without a reply.
 */
class UmamiClientTest {

    private HttpServer umami;

    @BeforeEach
    void start() throws IOException {
        umami = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        umami.createContext("/api/auth/login", exchange -> reply(exchange, "{\"token\":\"t\"}"));
        umami.createContext("/api/websites/site/stats", exchange -> reply(exchange, "{\"pageviews\":{\"value\":281,\"prev\":120}}"));
        umami.start();
    }

    @AfterEach
    void stop() {
        umami.stop(0);
    }

    private static void reply(HttpExchange exchange, String json) throws IOException {
        if (exchange.getRequestHeaders().containsKey("Upgrade")) {
            exchange.close();
            return;
        }
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, body.length);
        exchange.getResponseBody().write(body);
        exchange.close();
    }

    @Test
    @DisplayName("reads Umami over plain HTTP/1.1, never asking for the h2c upgrade Umami hangs up on")
    void readsStatsWithoutAnUpgrade() {
        var client = new UmamiClient("http://127.0.0.1:" + umami.getAddress().getPort(), "site", "admin", "secret");
        Instant now = Instant.now();

        var stats = client.stats(now.minus(1, ChronoUnit.DAYS), now);

        assertThat(stats.path("pageviews").path("value").asInt()).isEqualTo(281);
    }
}
