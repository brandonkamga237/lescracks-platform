package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Comma-separated list of allowed CORS origins.
     * Set via CORS_ORIGINS environment variable.
     * Example: "https://lescracks.com,https://www.lescracks.com"
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    /**
     * When false, Swagger UI and OpenAPI docs endpoints are protected
     * and require authentication (recommended for production).
     */
    @Value("${app.swagger.enabled:true}")
    private boolean swaggerEnabled;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            @Lazy OAuth2LoginSuccessHandler successHandler) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth -> {
                auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/oauth2/**").permitAll()
                    .requestMatchers("/login/**").permitAll()
                    .requestMatchers("/error").permitAll()
                    // Swagger — only public when enabled (dev/staging)
                    .requestMatchers(
                            "/swagger-ui/**", "/swagger-ui.html",
                            "/v3/api-docs/**", "/v3/api-docs.yaml",
                            "/swagger-resources/**", "/webjars/**")
                        .access((authentication, context) -> {
                            if (swaggerEnabled) {
                                return new org.springframework.security.authorization.AuthorizationDecision(true);
                            }
                            // In production require ADMIN role
                            return new org.springframework.security.authorization.AuthorizationDecision(
                                    authentication.get().getAuthorities().stream()
                                            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
                        })
                    // Public read-only endpoints
                    .requestMatchers(org.springframework.http.HttpMethod.GET,
                            "/api/users/avatars/**").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,
                            "/api/learners", "/api/learners/showcased", "/api/learners/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,
                            "/api/open-source/projects",
                            "/api/open-source/projects/featured",
                            "/api/open-source/contributors").permitAll()
                    // Admin endpoints
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    // All other API endpoints require authentication
                    .requestMatchers("/api/**").authenticated()
                    .anyRequest().permitAll();
            })
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"success\":false,\"message\":\"Access denied\"}");
                })
            )
            .oauth2Login(oauth2 -> oauth2.successHandler(successHandler))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID"));

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Use explicitly configured origins — never allow wildcard in production
        List<String> origins = Arrays.asList(allowedOrigins);
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        // Credentials are not needed: tokens are sent in the Authorization header, not cookies
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
