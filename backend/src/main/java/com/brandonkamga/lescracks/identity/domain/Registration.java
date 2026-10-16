package com.brandonkamga.lescracks.identity.domain;

/** A sign-up with email and password. Phone, consents and arrival are optional. */
public record Registration(String email, String password, String firstName, String lastName,
                           String phone, Boolean marketingConsent, Boolean newsletter, Arrival arrival) {
}
