package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.domain.NewsletterStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Long> {
    Optional<NewsletterSubscription> findByUserId(Long userId);

    List<NewsletterSubscription> findByStatus(NewsletterStatus status);

    long countByStatus(NewsletterStatus status);
}