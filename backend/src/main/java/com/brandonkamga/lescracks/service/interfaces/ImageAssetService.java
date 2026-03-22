package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.ImageAsset;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for ImageAsset operations.
 */
public interface ImageAssetService {

    /**
     * Find an image asset by ID.
     *
     * @param id the image asset ID
     * @return the image asset if found
     */
    ImageAsset findById(Long id);

    /**
     * Find an image asset by ID as Optional.
     *
     * @param id the image asset ID
     * @return Optional containing the image asset if found
     */
    Optional<ImageAsset> findByIdOptional(Long id);

    /**
     * Find all image assets.
     *
     * @return list of all image assets
     */
    List<ImageAsset> findAll();

    /**
     * Find an image asset by user ID.
     *
     * @param userId the user ID
     * @return the image asset for the user if found
     */
    Optional<ImageAsset> findByUserId(Long userId);

    /**
     * Find image assets by image type.
     *
     * @param imageType the image type
     * @return list of image assets with the specified type
     */
    List<ImageAsset> findByImageType(String imageType);

    /**
     * Save an image asset.
     *
     * @param imageAsset the image asset to save
     * @return the saved image asset
     */
    ImageAsset save(ImageAsset imageAsset);

    /**
     * Delete an image asset by ID.
     *
     * @param id the image asset ID
     */
    void deleteById(Long id);
}
