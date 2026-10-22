package com.brandonkamga.lescracks.shared.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/** The few conversions every SQL adapter needs between Java values and JDBC ones, written once. */
public final class JdbcValues {

    private JdbcValues() {
    }

    /** For a TIMESTAMPTZ parameter: the driver takes OffsetDateTime, not Instant. */
    public static OffsetDateTime at(Instant instant) {
        return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
    }

    public static Instant instant(ResultSet row, String column) throws SQLException {
        OffsetDateTime value = row.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }

    public static <E extends Enum<E>> E enumOf(ResultSet row, String column, Class<E> type) throws SQLException {
        String value = row.getString(column);
        return value == null ? null : Enum.valueOf(type, value);
    }

    public static String name(Enum<?> value) {
        return value == null ? null : value.name();
    }

    /** A Long column that may be NULL, which getLong would turn into 0. */
    public static Long longOrNull(ResultSet row, String column) throws SQLException {
        long value = row.getLong(column);
        return row.wasNull() ? null : value;
    }
}
