package com.brandonkamga.lescracks.exception;

import java.util.Map;

public class ResourceNotFoundException extends RuntimeException {

    /**
     * Callers name the entity in English, as the code does. The user reads French, and has no
     * use for a field name or an id they never saw — the path and the error code carry that
     * for the client.
     */
    private static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("Application", "Cette candidature est"),
            Map.entry("ApplicationType", "Ce type de candidature est"),
            Map.entry("Avatar", "Cette photo de profil est"),
            Map.entry("Category", "Cette catégorie est"),
            Map.entry("Comment", "Ce commentaire est"),
            Map.entry("Event", "Cet événement est"),
            Map.entry("EventStatus", "Ce statut d'événement est"),
            Map.entry("EventType", "Ce type d'événement est"),
            Map.entry("File", "Ce fichier est"),
            Map.entry("Learner", "Cet apprenant est"),
            Map.entry("LearnerProfile", "Ce profil d'apprenant est"),
            Map.entry("Provider", "Ce fournisseur de connexion est"),
            Map.entry("Resource", "Cette ressource est"),
            Map.entry("ResourceType", "Ce type de ressource est"),
            Map.entry("Role", "Ce rôle est"),
            Map.entry("Tag", "Ce tag est"),
            Map.entry("User", "Cet utilisateur est"));

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(LABELS.getOrDefault(resourceName, "L'élément demandé est") + " introuvable.");
    }
}
