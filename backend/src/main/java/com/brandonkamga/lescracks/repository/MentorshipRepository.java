package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Mentorship;
import org.springframework.data.jpa.repository.JpaRepository;

/** One row, so callers go through the service rather than guessing an id. */
public interface MentorshipRepository extends JpaRepository<Mentorship, Short> {
}
