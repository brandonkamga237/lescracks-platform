package com.brandonkamga.lescracks.recognition.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

/** A badge a member can hold. System badges come from rules; the admin creates the others. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Badge {
    public static final String EVENT_PARTICIPANT = "EVENT_PARTICIPANT";
    public static final String HACKATHON_PARTICIPANT = "HACKATHON_PARTICIPANT";
    public static final String HACKATHON_PODIUM = "HACKATHON_PODIUM";
    public static final String HACKATHON_WINNER = "HACKATHON_WINNER";

    /** The icons the site knows how to draw; anything else would show as a blank circle. */
    public static final Set<String> ICONS = Set.of("award", "trophy", "medal", "code", "calendar-check", "sparkles", "star",
            "flame", "heart", "rocket", "megaphone", "shield", "lightbulb", "users", "book-open");

    private Long id;
    private String code;
    private String name;
    private String description;

    /** A key the site turns into an icon (award, trophy, code…), never a file. */
    @Builder.Default
    private String icon = "award";

    private boolean system;

    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Only custom badges change: system badges keep the wording their rules rely on. */
    public void edit(String newName, String newDescription, String newIcon) {
        if (system) throw new BadRequestException("Un badge système ne se modifie pas : ses règles en dépendent.");
        name = newName.trim();
        description = newDescription.trim();
        icon = checkedIcon(newIcon);
    }

    public void checkDeletable() {
        if (system) throw new BadRequestException("Un badge système ne se supprime pas.");
    }

    public static String checkedIcon(String icon) {
        String key = icon == null || icon.isBlank() ? "award" : icon.trim();
        if (!ICONS.contains(key)) throw new BadRequestException("Icône inconnue : " + key + ".");
        return key;
    }
}
