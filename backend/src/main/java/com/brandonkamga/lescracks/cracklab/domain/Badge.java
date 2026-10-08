package com.brandonkamga.lescracks.cracklab.domain;

/** Achievements unlocked from a member's own record; nothing is stored, they are recomputed on read. */
public enum Badge {
    FIRST_STEP("Premier pas", "Envoyer sa première réponse"),
    FLAWLESS("Sans faute", "Obtenir au moins 90 % sur un challenge"),
    HARDCORE("Hardcore", "Obtenir au moins 70 % sur un challenge avancé"),
    VERSATILE("Polyvalent", "Répondre dans 3 catégories différentes"),
    REGULAR("Régulier", "Tenir une série de 4 semaines"),
    APPRECIATED("Apprécié", "Recevoir 10 votes nets sur ses réponses"),
    PODIUM("Podium", "Entrer dans le top 3 du classement");

    private final String label;
    private final String description;

    Badge(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String label() {
        return label;
    }

    public String description() {
        return description;
    }
}
