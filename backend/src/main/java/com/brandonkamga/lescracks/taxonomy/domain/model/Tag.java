package com.brandonkamga.lescracks.taxonomy.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A word on an article, unique by name ignoring case. */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    private Long id;

    private String name;
}
