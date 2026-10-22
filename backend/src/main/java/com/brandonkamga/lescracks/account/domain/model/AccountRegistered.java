package com.brandonkamga.lescracks.account.domain.model;

/**
 * Published inside the sign-up transaction. Other modules react to it without account knowing
 * them: the member module keeps the phone and consent, the newsletter subscribes on request.
 * A listener that throws undoes the whole sign-up.
 */
public record AccountRegistered(Long accountId, String email, String phone, Boolean marketingConsent,
                                boolean wantsNewsletter) {
}
