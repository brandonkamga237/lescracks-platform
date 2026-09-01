package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MediaRepository extends JpaRepository<Media, Long> {

    Optional<Media> findByObjectKey(String objectKey);

    /**
     * Images nothing points at, old enough that an upload still in progress is not caught.
     *
     * This is why media is a table rather than a column of urls: without it, a file uploaded
     * for a draft that was abandoned sits in storage forever, unnamed and unfindable.
     */
    @Query("""
            SELECT m FROM Media m
            WHERE m.createdAt < :before
              AND NOT EXISTS (SELECT 1 FROM Resource r JOIN r.media rm WHERE rm.id = m.id)
              AND NOT EXISTS (SELECT 1 FROM Resource r WHERE r.cover.id = m.id)
              AND NOT EXISTS (SELECT 1 FROM Event e WHERE e.cover.id = m.id)
              AND NOT EXISTS (SELECT 1 FROM User u WHERE u.avatar.id = m.id)
              AND NOT EXISTS (SELECT 1 FROM Mentorship p WHERE p.cover.id = m.id)
            """)
    List<Media> findUnreferencedBefore(Instant before);
}
