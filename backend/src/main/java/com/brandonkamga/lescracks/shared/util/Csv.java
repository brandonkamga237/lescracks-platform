package com.brandonkamga.lescracks.shared.util;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** The CSV the back office exports: semicolon-separated (Excel in French), quoted only when needed. */
public final class Csv {

    private static final DateTimeFormatter INSTANT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("UTC"));

    private Csv() {
    }

    /** One line, newline included; null becomes an empty cell. */
    public static String line(Object... values) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) line.append(';');
            String value = cell(values[i]);
            if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
                line.append('"').append(value.replace("\"", "\"\"")).append('"');
            } else {
                line.append(value);
            }
        }
        return line.append('\n').toString();
    }

    private static String cell(Object value) {
        if (value == null) return "";
        if (value instanceof Instant instant) return INSTANT.format(instant);
        return String.valueOf(value);
    }
}
