package com.brandonkamga.lescracks.newsletter.domain.port;

import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;

import java.util.List;

public interface CampaignStore {

    Campaign save(Campaign campaign);

    List<Campaign> findAllNewestFirst();
}
