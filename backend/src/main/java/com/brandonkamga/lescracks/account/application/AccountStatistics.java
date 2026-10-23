package com.brandonkamga.lescracks.account.application;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

/** The figures the dashboard reads about accounts, each computed by one SQL query. */
public interface AccountStatistics {

    Map<String, Long> membersByStatus();

    Map<String, Long> membersByProvider();

    long verifiedMembers();

    long membersCreatedSince(Instant since);

    /** Accounts of any kind active since then. */
    long seenSince(Instant since);

    /** New members per day, in order. */
    Map<LocalDate, Long> memberGrowth(Instant from, Instant to);

    /** New members since then per channel they came through; "Inconnue" for those who signed up before it was recorded. */
    Map<String, Long> signupsBySource(Instant since);

    /** The first pages that new members landed on, the most productive first. */
    Map<String, Long> signupsByLandingPage(Instant since, int limit);

    /** Members who signed up since then, and how far they went. */
    SignupCohort signupsSince(Instant since);

    /** {@code returned}: came back at least a day after signing up. */
    record SignupCohort(Set<Long> accountIds, long verified, long returned) {
        public long signedUp() {
            return accountIds.size();
        }
    }
}
