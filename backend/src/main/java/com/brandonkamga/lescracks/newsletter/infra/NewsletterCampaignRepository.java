package com.brandonkamga.lescracks.newsletter.infra;

import com.brandonkamga.lescracks.newsletter.domain.NewsletterCampaign;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NewsletterCampaignRepository extends JpaRepository<NewsletterCampaign, Long> {
    List<NewsletterCampaign> findAllByOrderBySentAtDesc();
}
