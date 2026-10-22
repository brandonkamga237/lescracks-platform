package com.brandonkamga.lescracks.account.application;

public interface SignUpService {

    /** Creates the account, or turns a newsletter-only contact with the same email into one. */
    AccountSummary register(Registration registration);
}
