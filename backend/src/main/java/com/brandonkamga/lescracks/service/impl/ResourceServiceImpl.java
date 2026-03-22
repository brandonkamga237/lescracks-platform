package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of ResourceService.
 */
@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Value("${app.uploads.dir:uploads/resources}")
    private String uploadDirectory;

    public ResourceServiceImpl(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Resource findById(Long id) {
        return resourceRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Resource> findByIdOptional(Long id) {
        return resourceRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findAll(Pageable page) {
        return resourceRepository.findAll(page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByCategoryId(Long categoryId, Pageable page) {
        return resourceRepository.findByCategoryIdWithPagination(categoryId, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByResourceTypeId(Long resourceTypeId, Pageable page) {
        return resourceRepository.findByResourceTypeId(resourceTypeId, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByResourceTypeName(String typeName, Pageable page) {
        return resourceRepository.findByResourceTypeName(typeName, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByTagsIn(List<Long> tagIds, Pageable page) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Page.empty(page);
        }
        return resourceRepository.findByTagsIn(tagIds, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByTypeNameAndCategoryId(String typeName, Long categoryId, Pageable page) {
        return resourceRepository.findByTypeNameAndCategoryId(typeName, categoryId, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByTypeNameAndTagsIn(String typeName, List<Long> tagIds, Pageable page) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Page.empty(page);
        }
        return resourceRepository.findByTypeNameAndTagsIn(typeName, tagIds, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByCategoryIdAndTagsIn(Long categoryId, List<Long> tagIds, Pageable page) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Page.empty(page);
        }
        return resourceRepository.findByCategoryIdAndTagsIn(categoryId, tagIds, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> findByTypeNameAndCategoryIdAndTagsIn(String typeName, Long categoryId, List<Long> tagIds, Pageable page) {
        if (tagIds == null || tagIds.isEmpty()) {
            return Page.empty(page);
        }
        return resourceRepository.findByTypeNameAndCategoryIdAndTagsIn(typeName, categoryId, tagIds, page);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> searchWithFilters(String typeName, Long categoryId, List<Long> tagIds, String searchTerm, Pageable page) {
        // Determine which query to use based on provided filters
        boolean hasType = typeName != null && !typeName.isEmpty();
        boolean hasCategory = categoryId != null;
        boolean hasTags = tagIds != null && !tagIds.isEmpty();
        boolean hasSearch = searchTerm != null && !searchTerm.isEmpty();
        
        // If no filters at all, return all resources
        if (!hasType && !hasCategory && !hasTags && !hasSearch) {
            return resourceRepository.findAll(page);
        }
        
        // Use the unified search query for complex filtering
        return resourceRepository.searchWithFilters(typeName, categoryId, searchTerm, tagIds, page);
    }

    @Override
    public Resource save(Resource resource) {
        return resourceRepository.save(resource);
    }

    @Override
    public void deleteById(Long id) {
        resourceRepository.deleteById(id);
    }

    @Override
    public void incrementViewCount(Long id) {
        resourceRepository.incrementViewCount(id);
    }

    @Override
    public void incrementDownloadCount(Long id) {
        resourceRepository.incrementDownloadCount(id);
    }

    /**
     * Store an uploaded file under {@code ./uploads/resources/} and return its public URL.
     * The directory is created automatically if it does not exist.
     * The file is stored with a UUID-prefixed name to avoid collisions.
     *
     * @param originalFileName original filename from the client
     * @param bytes            raw file bytes
     * @param contentType      MIME type (not used for local storage but kept for MinIO migration)
     * @return relative public URL, e.g. "/api/resources/files/uuid-report.pdf"
     */
    @Override
    public String storeFile(String originalFileName, byte[] bytes, String contentType) {
        try {
            Path uploadDir = Paths.get(uploadDirectory);
            Files.createDirectories(uploadDir);

            String extension = "";
            int dotIndex = originalFileName.lastIndexOf('.');
            if (dotIndex >= 0) {
                extension = originalFileName.substring(dotIndex);
            }
            String storedName = UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(storedName);
            Files.write(target, bytes);

            return "/api/resources/files/" + storedName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + originalFileName, e);
        }
    }
}
