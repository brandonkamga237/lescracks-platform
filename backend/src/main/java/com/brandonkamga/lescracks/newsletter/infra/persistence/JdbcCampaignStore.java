package com.brandonkamga.lescracks.newsletter.infra.persistence;

import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;
import com.brandonkamga.lescracks.newsletter.domain.port.CampaignStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcCampaignStore implements CampaignStore {

    private static final RowMapper<Campaign> ROW = (row, number) -> Campaign.builder()
            .id(row.getLong("id"))
            .subject(row.getString("subject"))
            .message(row.getString("message"))
            .recipientCount(row.getInt("recipient_count"))
            .sentAt(instant(row, "sent_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcCampaignStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Campaign save(Campaign campaign) {
        Long id = jdbc.sql("""
                INSERT INTO newsletter_campaigns (subject, message, recipient_count, sent_at)
                VALUES (:subject, :message, :recipients, :sentAt) RETURNING id""")
                .param("subject", campaign.getSubject())
                .param("message", campaign.getMessage())
                .param("recipients", campaign.getRecipientCount())
                .param("sentAt", at(campaign.getSentAt()))
                .query(Long.class).single();
        return campaign.toBuilder().id(id).build();
    }

    @Override
    public List<Campaign> findAllNewestFirst() {
        return jdbc.sql("SELECT id, subject, message, recipient_count, sent_at FROM newsletter_campaigns ORDER BY sent_at DESC, id DESC")
                .query(ROW).list();
    }
}
