package com.brandonkamga.lescracks.newsletter.infra;

import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterSubscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Long> {
    Optional<NewsletterSubscription> findByUserId(Long userId);

    List<NewsletterSubscription> findByStatus(NewsletterStatus status);

    long countByStatus(NewsletterStatus status);
}