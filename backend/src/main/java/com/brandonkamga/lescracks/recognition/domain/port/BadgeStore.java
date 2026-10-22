package com.brandonkamga.lescracks.recognition.domain.port;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface BadgeStore {

    /** System badges first, then by name. */
    List<Badge> findAll();

    Optional<Badge> findById(Long id);

    Optional<Badge> findByCode(String code);

    boolean codeTaken(String code);

    Badge save(Badge badge);

    void delete(Long id);

    /** Holders per badge id, for the whole catalogue in one query. */
    Map<Long, Long> countHolders();
}
