package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nullable — candidature publique sans compte
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = true)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_type_id", nullable = false)
    private ApplicationType applicationType;

    // Champs du formulaire public Accompagnement 360
    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email_address")
    private String emailAddress;

    @Column(name = "whatsapp_number")
    private String whatsappNumber;

    @Column(name = "age")
    private Integer age;

    @Column(name = "motivation_text", columnDefinition = "TEXT")
    private String motivationText;

    @Column(name = "technical_level")
    private String technicalLevel;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Null while the application is active; set when it's archived. That single field
     * replaced the whole seven-stage funnel: the admin just wants to list candidates
     * and, at will, set them aside or delete them.
     */
    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    /** Private note for the team. Never exposed publicly. */
    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    /** An event registration always carries an event; a 360 application never does. */
    public boolean isEventRegistration() {
        return event != null;
    }

    public boolean isArchived() {
        return archivedAt != null;
    }
}
