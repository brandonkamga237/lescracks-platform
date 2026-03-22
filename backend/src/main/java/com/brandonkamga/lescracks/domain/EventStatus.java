package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "event_statuses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private EventStatusEnum name;
}
