package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.ImageAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageAssetRepository extends JpaRepository<ImageAsset, Long> {
    Optional<ImageAsset> findByUserId(Long userId);
    List<ImageAsset> findByImageType(String imageType);
}
