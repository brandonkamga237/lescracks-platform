package com.brandonkamga.lescracks.account.application;

public interface SignInService {

    /** The member behind these credentials. An unverified address still signs in: it is asked to confirm, not locked out. */
    AccountSummary authenticate(Credentials credentials);
}
