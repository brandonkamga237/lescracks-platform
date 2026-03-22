package com.brandonkamga.lescracks.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.Scopes;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${app.swagger.title:LesCracks API}")
    private String apiTitle;

    @Value("${app.swagger.version:1.0.0}")
    private String apiVersion;

    @Value("${app.swagger.description:API pour la plateforme de formation LesCracks}")
    private String apiDescription;

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        // Scopes Google
        Scopes googleScopes = new Scopes();
        googleScopes.put("https://www.googleapis.com", "Accès au profil");
        googleScopes.put("https://www.googleapis.com", "Accès à l'email");

        // Scopes GitHub
        Scopes githubScopes = new Scopes();
        githubScopes.put("read:user", "Lire le profil utilisateur");
        githubScopes.put("user:email", "Lire l'email utilisateur");

        return new OpenAPI()
                .info(new Info()
                        .title(apiTitle)
                        .version(apiVersion)
                        .description(apiDescription)
                        .contact(new Contact()
                                .name("Équipe LesCracks")
                                .email("contact@lescracks.com")
                                .url("https://lescracks.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Développement"),
                        new Server().url("https://api.lescracks.com").description("Production")))
                // On déclare que l'API peut utiliser ces trois méthodes globalement
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .addSecurityItem(new SecurityRequirement().addList("googleOAuth"))
                .addSecurityItem(new SecurityRequirement().addList("githubOAuth"))
                .components(new Components()
                        // 1. Schéma JWT
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Entrez votre token JWT"))

                        // 2. Schéma Google OAuth2
                        .addSecuritySchemes("googleOAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.OAUTH2)
                                .description("Authentification via Google")
                                .flows(new OAuthFlows()
                                        .authorizationCode(new OAuthFlow()
                                                .authorizationUrl("https://accounts.google.com")
                                                .tokenUrl("https://oauth2.googleapis.com")
                                                .scopes(googleScopes))))

                        // 3. Schéma GitHub OAuth2
                        .addSecuritySchemes("githubOAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.OAUTH2)
                                .description("Authentification via GitHub")
                                .flows(new OAuthFlows()
                                        .authorizationCode(new OAuthFlow()
                                                .authorizationUrl("https://github.com")
                                                .tokenUrl("https://github.com")
                                                .scopes(githubScopes)))));
    }
}
