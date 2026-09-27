package com.brandonkamga.lescracks.newsletter.infra;

import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterSubscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.List;

public interface NewsletterSubscriptionRepository extends JpaRepository<NewsletterSubscription, Long> {
    Optional<NewsletterSubscription> findByUserId(Long userId);

    List<NewsletterSubscription> findByStatus(NewsletterStatus status);

    long countByStatus(NewsletterStatus status);

    long countByStatusAndSubscribedAtAfter(NewsletterStatus status, Instant since);

    long countByStatusAndUnsubscribedAtAfter(NewsletterStatus status, Instant since);

    @Query(value = """
            SELECT cast(subscribed_at as date) as d, count(*) as c
            FROM newsletter_subscriptions
            WHERE status = 'SUBSCRIBED' AND subscribed_at >= :from AND subscribed_at <= :to
            GROUP BY d
            ORDER BY d
            """, nativeQuery = true)
    List<Object[]> newsletterGrowth(@Param("from") Instant from, @Param("to") Instant to);
}