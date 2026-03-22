package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Resource;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Resource operations.
 */
public interface ResourceService {

    /**
     * Find a resource by ID.
     *
     * @param id the resource ID
     * @return the resource if found
     */
    Resource findById(Long id);

    /**
     * Find a resource by ID as Optional.
     *
     * @param id the resource ID
     * @return Optional containing the resource if found
     */
    Optional<Resource> findByIdOptional(Long id);

    /**
     * Find all resources with pagination.
     *
     * @param page the pagination parameters
     * @return page of resources
     */
    Page<Resource> findAll(Pageable page);

    /**
     * Find resources by category ID.
     *
     * @param categoryId the category ID
     * @param page the pagination parameters
     * @return page of resources in the specified category
     */
    Page<Resource> findByCategoryId(Long categoryId, Pageable page);

    /**
     * Find resources by resource type ID.
     *
     * @param resourceTypeId the resource type ID
     * @param page the pagination parameters
     * @return page of resources with the specified type
     */
    Page<Resource> findByResourceTypeId(Long resourceTypeId, Pageable page);

    /**
     * Find resources by resource type name (VIDEO or DOCUMENT).
     *
     * @param typeName the resource type name (VIDEO or DOCUMENT)
     * @param page the pagination parameters
     * @return page of resources with the specified type
     */
    Page<Resource> findByResourceTypeName(String typeName, Pageable page);

    /**
     * Find resources by tags (ANY of the specified tags).
     *
     * @param tagIds list of tag IDs
     * @param page the pagination parameters
     * @return page of resources having any of the specified tags
     */
    Page<Resource> findByTagsIn(List<Long> tagIds, Pageable page);

    /**
     * Find resources by type and category.
     *
     * @param typeName the resource type name (VIDEO or DOCUMENT)
     * @param categoryId the category ID
     * @param page the pagination parameters
     * @return page of resources matching the criteria
     */
    Page<Resource> findByTypeNameAndCategoryId(String typeName, Long categoryId, Pageable page);

    /**
     * Find resources by type and tags.
     *
     * @param typeName the resource type name (VIDEO or DOCUMENT)
     * @param tagIds list of tag IDs
     * @param page the pagination parameters
     * @return page of resources matching the criteria
     */
    Page<Resource> findByTypeNameAndTagsIn(String typeName, List<Long> tagIds, Pageable page);

    /**
     * Find resources by category and tags.
     *
     * @param categoryId the category ID
     * @param tagIds list of tag IDs
     * @param page the pagination parameters
     * @return page of resources matching the criteria
     */
    Page<Resource> findByCategoryIdAndTagsIn(Long categoryId, List<Long> tagIds, Pageable page);

    /**
     * Find resources by type, category and tags.
     *
     * @param typeName the resource type name (VIDEO or DOCUMENT)
     * @param categoryId the category ID
     * @param tagIds list of tag IDs
     * @param page the pagination parameters
     * @return page of resources matching the criteria
     */
    Page<Resource> findByTypeNameAndCategoryIdAndTagsIn(String typeName, Long categoryId, List<Long> tagIds, Pageable page);

    /**
     * Search resources with multiple filters and pagination.
     *
     * @param typeName the resource type name (VIDEO or DOCUMENT) - optional
     * @param categoryId the category ID - optional
     * @param tagIds list of tag IDs - optional
     * @param searchTerm the search term for title/description - optional
     * @param page the pagination parameters
     * @return page of resources matching the criteria
     */
    Page<Resource> searchWithFilters(String typeName, Long categoryId, List<Long> tagIds, String searchTerm, Pageable page);

    /**
     * Save a resource.
     *
     * @param resource the resource to save
     * @return the saved resource
     */
    Resource save(Resource resource);

    /**
     * Delete a resource by ID.
     *
     * @param id the resource ID
     */
    void deleteById(Long id);

    /**
     * Atomically increment the view count for a resource.
     *
     * @param id the resource ID
     */
    void incrementViewCount(Long id);

    /**
     * Atomically increment the download count for a resource.
     *
     * @param id the resource ID
     */
    void incrementDownloadCount(Long id);

    /**
     * Store an uploaded file and return its public URL.
     *
     * @param originalFileName original filename from the client
     * @param bytes            raw file bytes
     * @param contentType      MIME type of the file
     * @return public URL to access the stored file
     */
    String storeFile(String originalFileName, byte[] bytes, String contentType);
}
