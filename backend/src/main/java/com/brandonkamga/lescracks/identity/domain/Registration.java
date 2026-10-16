package com.brandonkamga.lescracks.identity.domain;

/** A sign-up with email and password. Phone, consent and arrival are optional. */
public record Registration(String email, String password, String firstName, String lastName,
                           String phone, Boolean marketingConsent, Arrival arrival) {
}
