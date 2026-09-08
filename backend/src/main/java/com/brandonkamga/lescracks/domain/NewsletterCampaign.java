package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "newsletter_campaigns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 10000)
    private String message;

    @Column(name = "recipient_count", nullable = false)
    private int recipientCount;

    @Column(name = "sent_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant sentAt = Instant.now();
}
