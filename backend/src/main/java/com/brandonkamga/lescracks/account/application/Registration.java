package com.brandonkamga.lescracks.account.application;

/**
 * A sign-up with email and password. Phone and consents are optional and only travel through:
 * account keeps none of them, the {@code AccountRegistered} listeners do.
 */
public record Registration(String email, String password, String firstName, String lastName,
                           String phone, Boolean marketingConsent, Boolean newsletter, Arrival arrival) {
}
