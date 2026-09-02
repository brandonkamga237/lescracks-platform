package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * A video, which the platform references rather than hosts.
 *
 * Hosting video is a different business — storage, bandwidth, a player, transcoding — and
 * the platform has decided not to be in it. What it keeps is where to watch.
 */
@Entity
@Table(name = "resource_videos")
@DiscriminatorValue("VIDEO")
@PrimaryKeyJoinColumn(name = "resource_id")
@Getter
@Setter
public class ResourceVideo extends Resource {

    public ResourceVideo() {
        super(ResourceKind.VIDEO);
    }

    /** Where it plays: a YouTube link, or another platform's. */
    @Column(name = "external_url", nullable = false, length = 1000)
    private String externalUrl;

    /** Shown so a reader can judge the commitment before clicking. Null when unknown. */
    @Column(name = "duration_seconds")
    private Integer durationSeconds;
}
