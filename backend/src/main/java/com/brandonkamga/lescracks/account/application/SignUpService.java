package com.brandonkamga.lescracks.account.application;

public interface SignUpService {

    /** Creates the account; an address that already has one is refused. */
    AccountSummary register(Registration registration);
}
