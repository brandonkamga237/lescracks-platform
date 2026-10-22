package com.brandonkamga.lescracks.member.application;

import java.util.Collection;
import java.util.Map;

/** The figures the dashboard reads about profiles, each computed by one SQL query. */
public interface MemberStatistics {

    Map<String, Long> bySituation();

    Map<String, Long> byGoal();

    Map<String, Long> byCountry();

    /** Members per interest, keyed by category id. */
    Map<Long, Long> byInterest();

    /** How many of these members answered or put off the welcome questions. */
    long countOnboarded(Collection<Long> accountIds);
}
