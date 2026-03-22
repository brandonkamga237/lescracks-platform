package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resource_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private ResourceTypeName name;
}
