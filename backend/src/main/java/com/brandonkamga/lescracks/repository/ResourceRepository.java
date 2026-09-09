package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByStatusOrderByCreatedAtDesc(ResourceStatus status);

        @Query("""
                        select r from Resource r
                        where (:status is null or r.status = :status)
                            and (:search is null or lower(r.title) like concat('%', lower(cast(:search as string)), '%'))
                            and (:categoryId is null or r.category.id = :categoryId)
                            and (:tagId is null or exists (select t.id from Resource r2 join r2.tags t where r2.id = r.id and t.id = :tagId))
                              and (:kind is null
                                     or (:kind = 'EBOOK' and exists (select e.resourceId from Ebook e where e.resourceId = r.id))
                                     or (:kind = 'EXTERNAL_VIDEO' and exists (select v.resourceId from ExternalVideoReference v where v.resourceId = r.id))
                                     or (:kind = 'ARTICLE' and exists (select a.resourceId from Article a where a.resourceId = r.id)))
                        order by r.createdAt desc
                        """)
        Page<Resource> search(@Param("status") ResourceStatus status, @Param("search") String search,
                              @Param("kind") String kind, @Param("categoryId") Long categoryId,
                              @Param("tagId") Long tagId,
                              Pageable pageable);

    @Query("""
            select r.id, r.title, count(l.id)
            from Resource r
            left join ResourceLike l on l.resource.id = r.id
            group by r.id, r.title
            order by count(l.id) desc
            """)
    List<Object[]> topResources(Pageable pageable);

    @Query("select r.status, count(r) from Resource r group by r.status")
    List<Object[]> countGroupedByStatus();

    @Query("select count(e) from Ebook e")
    long countEbooks();

    @Query("select count(v) from ExternalVideoReference v")
    long countExternalVideos();

    @Query("select count(a) from Article a")
    long countArticles();

    @Query("""
            select c.name, count(r)
            from Resource r join r.category c
            group by c.name
            order by count(r) desc
            """)
    List<Object[]> countGroupedByCategory();
}