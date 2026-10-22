package com.brandonkamga.lescracks.shared.paging;

import java.util.List;
import java.util.function.Function;

/** One page of results and the total behind it, as a domain returns them. */
public record Paged<T>(List<T> items, int page, int size, long total) {

    public int totalPages() {
        return (int) Math.ceil((double) total / size);
    }

    public <R> Paged<R> map(Function<T, R> mapper) {
        return new Paged<>(items.stream().map(mapper).toList(), page, size, total);
    }
}
