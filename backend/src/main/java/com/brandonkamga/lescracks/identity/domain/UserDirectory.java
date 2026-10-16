package com.brandonkamga.lescracks.identity.domain;

import java.util.Optional;

/** How other domains look people up or record a contact, without reaching into identity's storage. */
public interface UserDirectory {

    Optional<User> find(String email);

    User require(String email);

    User require(Long id);

    /** A person known only by email (a newsletter subscriber): no password, no social login. */
    User createContact(String email, String firstName, String lastName);
}
