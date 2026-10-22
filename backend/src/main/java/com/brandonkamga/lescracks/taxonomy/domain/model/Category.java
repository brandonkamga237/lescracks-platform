package com.brandonkamga.lescracks.taxonomy.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A theme of the blog, also offered to members as an interest. Admin-managed, renamed over time. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    private Long id;

    private String name;

    private String slug;

    private String description;
}
