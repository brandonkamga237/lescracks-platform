package com.brandonkamga.lescracks.shared.paging;

/** Which page a domain is asked for, numbered from 0. Plain Java, so domains need no Spring Data. */
public record PageQuery(int page, int size) {

    public PageQuery {
        if (page < 0) throw new IllegalArgumentException("page must be >= 0");
        if (size < 1) throw new IllegalArgumentException("size must be >= 1");
    }
}
