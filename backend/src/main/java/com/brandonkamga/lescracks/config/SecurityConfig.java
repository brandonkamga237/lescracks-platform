package com.brandonkamga.lescracks.config;

import java.io.IOException;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.brandonkamga.lescracks.exception.ErrorCode;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.security.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
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

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, @Lazy OAuth2LoginSuccessHandler successHandler) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/login/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/sitemap.xml").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/seo/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/v3/api-docs.yaml", "/swagger-resources/**", "/webjars/**").permitAll()
                // Endpoints publics — lecture seule sans compte
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/avatars/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/resources", "/api/resources/*", "/api/resources/slug/*", "/api/resources/types").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/resources/*/likes", "/api/resources/*/comments").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/resources/*/view").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories", "/api/categories/*").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/tags", "/api/tags/*").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/events", "/api/events/*", "/api/events/slug/*", "/api/events/types", "/api/events/statuses").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/learners", "/api/learners/showcased", "/api/learners/*").permitAll()
                // Candidature publique Accompagnement 360 — aucun compte requis
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/applications").permitAll()
                // Types de candidature — nécessaires au formulaire public pour résoudre
                // l'id du type par son nom plutôt que de le coder en dur côté client.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/applications/types").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/programme/status").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            // Spring Security answers before any controller runs, so these two never reach
            // GlobalExceptionHandler. They write the same envelope by hand rather than a
            // bespoke JSON string, so a client parses one shape whatever refused the request.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) ->
                    writeError(response, HttpServletResponse.SC_UNAUTHORIZED, request.getRequestURI(),
                            ErrorCode.UNAUTHENTICATED,
                            "Vous devez être connecté pour accéder à cette ressource."))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    writeError(response, HttpServletResponse.SC_FORBIDDEN, request.getRequestURI(),
                            ErrorCode.FORBIDDEN,
                            "Vous n'avez pas les droits nécessaires pour cette action."))
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(successHandler)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
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

    private static void writeError(HttpServletResponse response, int status, String path,
                                   ErrorCode code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .writeValue(response.getWriter(), ApiResponse.error(message, path, code));
    }
}
