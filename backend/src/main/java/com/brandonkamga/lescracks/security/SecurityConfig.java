package com.brandonkamga.lescracks.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * The API verifies tokens Keycloak signed and nothing more.
 *
 * There is no login endpoint here, no password hashing, no reset flow and no provider
 * plumbing: all of that is realm configuration now. What remains is the decision of which
 * routes are open, which is the only part that belongs to the application.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final String[] corsOrigins;

    public SecurityConfig(@Value("${app.cors.allowed-origins:http://localhost:5173}") String origins) {
        this.corsOrigins = origins.split(",");
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, KeycloakRoleConverter roleConverter,
                                    SecurityErrorWriter errors) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // No cookie, no session: every request carries its own bearer token.
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Rejections happen in this chain, never in a controller, so the error body has
            // to be written here or the client gets a bare status and an empty response.
            .exceptionHandling(handling -> handling
                    .authenticationEntryPoint(errors)
                    .accessDeniedHandler(errors))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/error").permitAll()
                .requestMatchers("/seo/**", "/api/sitemap.xml").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                // Admin routes live under each domain, not under one /api/admin tree. Every
                // one of them also carries @PreAuthorize; this matcher is the second lock,
                // so a method someone forgets to annotate is still not an open door.
                .requestMatchers("/api/*/admin", "/api/*/admin/**").hasRole("ADMIN")

                // Anyone may read the catalogue and check an attestation. Reading is what
                // brings people in; asking them to sign up first is what keeps them out.
                .requestMatchers(HttpMethod.GET, "/api/events", "/api/events/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources", "/api/resources/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories", "/api/tags").permitAll()
                // Whether the 360 is open decides what the landing page offers.
                .requestMatchers(HttpMethod.GET, "/api/mentorship").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/attestations/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/resources/*/view").permitAll()
                // Applying does not require an account: people apply first and register after.
                .requestMatchers(HttpMethod.POST, "/api/applications").permitAll()

                .anyRequest().authenticated())
            // The resource server keeps its own pair, or a bad token would answer with the
            // bare bearer-token default instead of the body every other failure uses.
            .oauth2ResourceServer(oauth -> oauth
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(roleConverter))
                    .authenticationEntryPoint(errors)
                    .accessDeniedHandler(errors));

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(corsOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
