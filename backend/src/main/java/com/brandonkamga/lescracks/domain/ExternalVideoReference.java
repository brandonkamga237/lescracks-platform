package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A video resource, which the platform references rather than hosts.
 *
 * Hosting video is a different business — storage, bandwidth, a player, transcoding —
 * and the platform has decided not to be in it. What it keeps is where to watch.
 */
@Entity
@Table(name = "external_video_references")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalVideoReference {

    @Id
    @Column(name = "resource_id")
    private Long resourceId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @Column(name = "video_url", nullable = false, length = 1000)
    private String videoUrl;

    @Column(nullable = false, length = 50)
    private String platform;
}