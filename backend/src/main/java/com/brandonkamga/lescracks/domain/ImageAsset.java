package com.brandonkamga.lescracks.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "image_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", nullable = false)
    private ImageType imageType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type")
    private String mimeType;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
}
