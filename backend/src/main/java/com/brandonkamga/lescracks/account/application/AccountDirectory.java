package com.brandonkamga.lescracks.account.application;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/** How other modules look accounts up or record a contact, without reaching into account's storage. */
public interface AccountDirectory {

    Optional<AccountSummary> find(String email);

    AccountSummary require(String email);

    AccountSummary require(Long id);

    /** Several accounts in one query, by id; unknown ids are simply absent. */
    Map<Long, AccountSummary> findAll(Collection<Long> ids);

    /** Several accounts in one query, keyed by lower-cased email; unknown addresses are absent. */
    Map<String, AccountSummary> findAllByEmail(Collection<String> emails);

    /** Null leaves a name as it is; a blank name is refused. */
    AccountSummary rename(Long id, String firstName, String lastName);

    /** Kept from the first visit only: later calls change nothing. */
    void recordArrival(Long id, Arrival arrival);
}
