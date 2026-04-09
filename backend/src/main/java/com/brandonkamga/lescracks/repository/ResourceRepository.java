package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.ResourceTypeName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    // Basic finders
    List<Resource> findByCategoryId(Long categoryId);
    List<Resource> findByResourceTypeId(Long resourceTypeId);
    
    // Find resources by category with pagination
    Page<Resource> findByCategoryId(Long categoryId, Pageable pageable);
    
    // Find resources by resource type with pagination
    Page<Resource> findByResourceTypeId(Long resourceTypeId, Pageable pageable);
    
    // Find all resources with pagination
    @Override
    Page<Resource> findAll(Pageable pageable);
    
    // Custom query: Filter by resource type name (VIDEO or DOCUMENT)
    @Query("SELECT r FROM Resource r WHERE r.resourceType.name = :typeName")
    Page<Resource> findByResourceTypeName(@Param("typeName") String typeName, Pageable pageable);
    
    // Custom query: Filter by category ID
    @Query("SELECT r FROM Resource r WHERE r.category.id = :categoryId")
    Page<Resource> findByCategoryIdWithPagination(@Param("categoryId") Long categoryId, Pageable pageable);
    
    // Custom query: Filter by tags (resources that have ANY of the specified tags)
    @Query("SELECT DISTINCT r FROM Resource r JOIN r.tags t WHERE t.id IN :tagIds")
    Page<Resource> findByTagsIn(@Param("tagIds") List<Long> tagIds, Pageable pageable);
    
    // Custom query: Filter by resource type AND category
    @Query("SELECT r FROM Resource r WHERE r.resourceType.name = :typeName AND r.category.id = :categoryId")
    Page<Resource> findByTypeNameAndCategoryId(
            @Param("typeName") String typeName, 
            @Param("categoryId") Long categoryId, 
            Pageable pageable);
    
    // Custom query: Filter by resource type AND tags (ANY tag)
    @Query("SELECT DISTINCT r FROM Resource r JOIN r.tags t WHERE r.resourceType.name = :typeName AND t.id IN :tagIds")
    Page<Resource> findByTypeNameAndTagsIn(
            @Param("typeName") String typeName, 
            @Param("tagIds") List<Long> tagIds, 
            Pageable pageable);
    
    // Custom query: Filter by category AND tags (ANY tag)
    @Query("SELECT DISTINCT r FROM Resource r JOIN r.tags t WHERE r.category.id = :categoryId AND t.id IN :tagIds")
    Page<Resource> findByCategoryIdAndTagsIn(
            @Param("categoryId") Long categoryId, 
            @Param("tagIds") List<Long> tagIds, 
            Pageable pageable);
    
    // Custom query: Filter by resource type AND category AND tags (ANY tag)
    @Query("SELECT DISTINCT r FROM Resource r JOIN r.tags t WHERE r.resourceType.name = :typeName AND r.category.id = :categoryId AND t.id IN :tagIds")
    Page<Resource> findByTypeNameAndCategoryIdAndTagsIn(
            @Param("typeName") String typeName, 
            @Param("categoryId") Long categoryId, 
            @Param("tagIds") List<Long> tagIds, 
            Pageable pageable);
    
    // Search by title or description
    @Query("SELECT r FROM Resource r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Resource> searchByTitleOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Search with filters
    @Query("SELECT DISTINCT r FROM Resource r LEFT JOIN r.tags t " +
           "WHERE (:typeName IS NULL OR r.resourceType.name = :typeName) " +
           "AND (:categoryId IS NULL OR r.category.id = :categoryId) " +
           "AND (:searchTerm IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:tagIds IS NULL OR t.id IN :tagIds)")
    Page<Resource> searchWithFilters(
            @Param("typeName") String typeName,
            @Param("categoryId") Long categoryId,
            @Param("searchTerm") String searchTerm,
            @Param("tagIds") List<Long> tagIds,
            Pageable pageable);
    
    // Text search with optional type and category filters (no tags — avoids null collection issue)
    @Query("SELECT r FROM Resource r " +
           "WHERE (:typeName IS NULL OR r.resourceType.name = :typeName) " +
           "AND (:categoryId IS NULL OR r.category.id = :categoryId) " +
           "AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "  OR LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Resource> searchByTermWithFilters(
            @Param("typeName") String typeName,
            @Param("categoryId") Long categoryId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Atomic increment — avoids load/save race conditions
    @Modifying
    @Query("UPDATE Resource r SET r.viewCount = r.viewCount + 1 WHERE r.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Resource r SET r.downloadCount = r.downloadCount + 1 WHERE r.id = :id")
    void incrementDownloadCount(@Param("id") Long id);

    // Top resources
    List<Resource> findTop5ByOrderByViewCountDesc();
    List<Resource> findTop5ByOrderByDownloadCountDesc();

    // Dashboard analytics methods
    long countByResourceType_Name(ResourceTypeName typeName);
    
    @Query("SELECT r.category, COUNT(r) FROM Resource r GROUP BY r.category ORDER BY COUNT(r) DESC")
    List<Object[]> countByCategoryGrouped();
    
    long countByCreatedAtAfter(LocalDateTime dateTime);
}
