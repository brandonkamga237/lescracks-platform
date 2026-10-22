package com.brandonkamga.lescracks.account.domain.port;

/**
 * Business counters for the auth funnel: who logs in, through which provider, and how often it
 * fails. Answers what "users can't sign in" would otherwise require digging through logs for.
 */
public interface AuthMetrics {

    /** {@code audience}: member or admin; {@code provider}: local, google, github. */
    void login(String audience, String provider, boolean success);

    void register(boolean success);
}
