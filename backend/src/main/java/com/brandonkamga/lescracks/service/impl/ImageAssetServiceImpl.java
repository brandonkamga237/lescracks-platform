package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.ImageAsset;
import com.brandonkamga.lescracks.repository.ImageAssetRepository;
import com.brandonkamga.lescracks.service.interfaces.ImageAssetService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of ImageAssetService.
 */
@Service
@Transactional
public class ImageAssetServiceImpl implements ImageAssetService {

    private final ImageAssetRepository imageAssetRepository;

    public ImageAssetServiceImpl(ImageAssetRepository imageAssetRepository) {
        this.imageAssetRepository = imageAssetRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ImageAsset findById(Long id) {
        return imageAssetRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ImageAsset> findByIdOptional(Long id) {
        return imageAssetRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ImageAsset> findAll() {
        return imageAssetRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ImageAsset> findByUserId(Long userId) {
        return imageAssetRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ImageAsset> findByImageType(String imageType) {
        return imageAssetRepository.findByImageType(imageType);
    }

    @Override
    public ImageAsset save(ImageAsset imageAsset) {
        return imageAssetRepository.save(imageAsset);
    }

    @Override
    public void deleteById(Long id) {
        imageAssetRepository.deleteById(id);
    }
}
