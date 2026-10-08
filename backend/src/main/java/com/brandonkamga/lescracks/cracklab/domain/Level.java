package com.brandonkamga.lescracks.cracklab.domain;

import java.util.List;

/**
 * Ranks earned with XP, where XP is the sum of a member's technical scores. The gaps widen on
 * purpose: the first levels come within a couple of challenges, the last ones take a season.
 */
public record Level(int number, String name, long minXp) {

    public static final List<Level> ALL = List.of(
            new Level(1, "Recrue", 0),
            new Level(2, "Apprenti", 100),
            new Level(3, "Ingénieur", 300),
            new Level(4, "Senior", 700),
            new Level(5, "Staff", 1200),
            new Level(6, "Principal", 2000),
            new Level(7, "Crack", 3000));

    public static Level of(long xp) {
        Level reached = ALL.get(0);
        for (Level level : ALL) {
            if (xp >= level.minXp()) {
                reached = level;
            }
        }
        return reached;
    }

    /** The level after this one, or null at the top. */
    public Level next() {
        return number < ALL.size() ? ALL.get(number) : null;
    }
}
