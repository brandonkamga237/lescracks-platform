package com.brandonkamga.lescracks.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.Scopes;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The API never talks to Google or GitHub: Keycloak does, and this API only verifies the
 * token that comes back. So a single scheme is documented here, pointed at the realm —
 * adding a provider changes realm configuration and nothing in this file.
 */
@Configuration
public class OpenApiConfig {

    private final String title;
    private final String version;
    private final String description;
    private final String issuer;

    public OpenApiConfig(
            @Value("${app.swagger.title:LesCracks API}") String title,
            @Value("${app.swagger.version:1.0.0}") String version,
            @Value("${app.swagger.description:API de la plateforme LesCracks}") String description,
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer) {
        this.title = title;
        this.version = version;
        this.description = description;
        this.issuer = issuer;
    }

    @Bean
    OpenAPI openApi() {
        return new OpenAPI()
                .info(new Info()
                        .title(title)
                        .version(version)
                        .description(description)
                        .contact(new Contact().name("LesCracks").url("https://lescracks.com")))
                .addSecurityItem(new SecurityRequirement().addList("keycloak"))
                .components(new Components().addSecuritySchemes("keycloak", keycloak()));
    }

    private SecurityScheme keycloak() {
        Scopes scopes = new Scopes()
                .addString("openid", "Identifier le porteur du jeton")
                .addString("profile", "Nom et photo de profil")
                .addString("email", "Adresse e-mail");

        return new SecurityScheme()
                .type(SecurityScheme.Type.OAUTH2)
                .description("Connexion via Keycloak (Google, GitHub ou mot de passe)")
                .flows(new OAuthFlows().authorizationCode(new OAuthFlow()
                        .authorizationUrl(issuer + "/protocol/openid-connect/auth")
                        .tokenUrl(issuer + "/protocol/openid-connect/token")
                        .scopes(scopes)));
    }
}
