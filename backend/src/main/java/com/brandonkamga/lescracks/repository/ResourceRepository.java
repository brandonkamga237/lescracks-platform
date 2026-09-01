package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceKind;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResourceRepository extends JpaRepository<Resource, Long> {

    Optional<Resource> findBySlug(String slug);

    boolean existsBySlug(String slug);

    /**
     * The catalogue, filtered by whatever the caller supplied and nothing else.
     *
     * One query rather than a branch per combination: the previous model had eight, and the
     * one that mattered was broken for months because nothing exercised that particular
     * corner. Every parameter is nullable and a null means "no filter on this".
     */
    @Query("""
            SELECT DISTINCT r FROM Resource r
            LEFT JOIN r.tags t
            WHERE r.published = TRUE
              AND (:kind IS NULL OR r.kind = :kind)
              AND (:categoryId IS NULL OR r.category.id = :categoryId)
              AND (:tagIds IS NULL OR t.id IN :tagIds)
              AND (:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            """)
    Page<Resource> search(ResourceKind kind, Long categoryId, Collection<Long> tagIds,
                          String search, Pageable pageable);

    /**
     * Counting a view without loading the row and writing it back, which would lose
     * concurrent views and take a lock for a number nobody edits.
     */
    @Modifying
    @Query("UPDATE Resource r SET r.viewCount = r.viewCount + 1 WHERE r.id = :id")
    void recordView(Long id);

    /** Slugs only: a sitemap needs no rows, and this one grows with the catalogue. */
    @Query("SELECT r.slug FROM Resource r WHERE r.published = TRUE ORDER BY r.slug")
    List<String> findPublishedSlugs();
}
