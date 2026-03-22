package com.brandonkamga.lescracks.security.oauth;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Factory component that provides the appropriate OAuthUserInfoExtractor for a given provider.
 * Follows Factory Pattern and Dependency Inversion Principle.
 */
@Component
public class OAuthUserInfoExtractorFactory {

    private final Map<String, OAuthUserInfoExtractor> extractorMap;

    /**
     * Constructor that auto-discovers all OAuthUserInfoExtractor implementations.
     * Uses Spring's dependency injection to get all implementations.
     * 
     * @param extractors list of all OAuthUserInfoExtractor implementations
     */
    public OAuthUserInfoExtractorFactory(List<OAuthUserInfoExtractor> extractors) {
        this.extractorMap = extractors.stream()
                .collect(Collectors.toMap(
                        extractor -> {
                            // Extract provider name from class name for default mapping
                            String className = extractor.getClass().getSimpleName();
                            if (className.contains("Google")) {
                                return "google";
                            } else if (className.contains("GitHub")) {
                                return "github";
                            }
                            return className.toLowerCase();
                        },
                        Function.identity()
                ));
    }

    /**
     * Get the appropriate extractor for the given provider.
     * 
     * @param provider the OAuth provider name (e.g., "google", "github")
     * @return the appropriate OAuthUserInfoExtractor
     * @throws IllegalArgumentException if no extractor is found for the provider
     */
    public OAuthUserInfoExtractor getExtractor(String provider) {
        OAuthUserInfoExtractor extractor = extractorMap.get(provider.toLowerCase());
        if (extractor == null) {
            throw new IllegalArgumentException("No OAuth extractor found for provider: " + provider);
        }
        return extractor;
    }

    /**
     * Check if an extractor exists for the given provider.
     * 
     * @param provider the OAuth provider name
     * @return true if an extractor exists
     */
    public boolean hasExtractor(String provider) {
        return extractorMap.containsKey(provider.toLowerCase());
    }
}
