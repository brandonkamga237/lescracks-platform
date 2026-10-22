package com.brandonkamga.lescracks.recognition.infra.persistence;

import com.brandonkamga.lescracks.recognition.domain.model.Certificate;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateKind;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateStatus;
import com.brandonkamga.lescracks.recognition.domain.port.CertificateStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.longOrNull;

@Component
class JdbcCertificateStore implements CertificateStore {

    private static final String COLUMNS = """
            id, code, user_id, event_id, kind, holder_name, title, detail, event_date, status, issued_at, created_at""";

    private static final RowMapper<Certificate> ROW = (row, number) -> Certificate.builder()
            .id(row.getLong("id"))
            .code(row.getString("code"))
            .userId(row.getLong("user_id"))
            .eventId(longOrNull(row, "event_id"))
            .kind(enumOf(row, "kind", CertificateKind.class))
            .holderName(row.getString("holder_name"))
            .title(row.getString("title"))
            .detail(row.getString("detail"))
            .eventDate(instant(row, "event_date"))
            .status(enumOf(row, "status", CertificateStatus.class))
            .issuedAt(instant(row, "issued_at"))
            .createdAt(instant(row, "created_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcCertificateStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Certificate> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM certificates WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Certificate> findByCode(String code) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM certificates WHERE code = :code").param("code", code).query(ROW).optional();
    }

    @Override
    public List<Certificate> findAllById(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return jdbc.sql("SELECT " + COLUMNS + " FROM certificates WHERE id IN (:ids)").param("ids", ids).query(ROW).list();
    }

    @Override
    public List<Certificate> findByEvent(Long eventId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM certificates WHERE event_id = :event ORDER BY kind, holder_name")
                .param("event", eventId).query(ROW).list();
    }

    @Override
    public List<Certificate> findIssuedTo(Long userId) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM certificates WHERE user_id = :user AND status = 'ISSUED' ORDER BY issued_at DESC")
                .param("user", userId).query(ROW).list();
    }

    @Override
    public int addDrafts(List<Certificate> drafts) {
        if (drafts.isEmpty()) return 0;
        return jdbc.sql("""
                        INSERT INTO certificates (code, user_id, event_id, kind, holder_name, title, detail, event_date, status)
                        SELECT d.code, d.user_id, d.event_id, d.kind, d.holder_name, d.title, d.detail, d.event_date, 'DRAFT'
                        FROM unnest(CAST(:codes AS VARCHAR[]), CAST(:users AS BIGINT[]), CAST(:events AS BIGINT[]),
                                    CAST(:kinds AS VARCHAR[]), CAST(:names AS VARCHAR[]), CAST(:titles AS VARCHAR[]),
                                    CAST(:details AS VARCHAR[]), CAST(:dates AS TIMESTAMPTZ[]))
                             AS d (code, user_id, event_id, kind, holder_name, title, detail, event_date)
                        ON CONFLICT (user_id, event_id, kind) DO NOTHING""")
                .param("codes", drafts.stream().map(Certificate::getCode).toArray(String[]::new))
                .param("users", drafts.stream().map(Certificate::getUserId).toArray(Long[]::new))
                .param("events", drafts.stream().map(Certificate::getEventId).toArray(Long[]::new))
                .param("kinds", drafts.stream().map(draft -> draft.getKind().name()).toArray(String[]::new))
                .param("names", drafts.stream().map(Certificate::getHolderName).toArray(String[]::new))
                .param("titles", drafts.stream().map(Certificate::getTitle).toArray(String[]::new))
                .param("details", drafts.stream().map(Certificate::getDetail).toArray(String[]::new))
                .param("dates", drafts.stream().map(draft -> draft.getEventDate() == null ? null : draft.getEventDate().toString())
                        .toArray(String[]::new))
                .update();
    }

    @Override
    public void saveAll(Collection<Certificate> certificates) {
        if (certificates.isEmpty()) return;
        jdbc.sql("""
                        UPDATE certificates c SET status = d.status, holder_name = d.holder_name, issued_at = d.issued_at
                        FROM unnest(CAST(:ids AS BIGINT[]), CAST(:statuses AS VARCHAR[]), CAST(:names AS VARCHAR[]),
                                    CAST(:issued AS TIMESTAMPTZ[])) AS d (id, status, holder_name, issued_at)
                        WHERE c.id = d.id""")
                .param("ids", certificates.stream().map(Certificate::getId).toArray(Long[]::new))
                .param("statuses", certificates.stream().map(certificate -> certificate.getStatus().name()).toArray(String[]::new))
                .param("names", certificates.stream().map(Certificate::getHolderName).toArray(String[]::new))
                .param("issued", certificates.stream().map(certificate -> certificate.getIssuedAt() == null ? null
                        : certificate.getIssuedAt().toString()).toArray(String[]::new))
                .update();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM certificates WHERE id = :id").param("id", id).update();
    }
}
