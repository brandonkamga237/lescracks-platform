package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.SignupContext;

/** Rules shared by sign-up, the welcome questions and the profile form. */
final class MemberProfiles {

    private MemberProfiles() {
    }

    /** Null leaves the number alone, blank removes it; a number brings its country with it. */
    static void phone(User user, String raw) {
        if (raw == null) return;
        if (raw.isBlank()) {
            user.setPhone(null);
            user.setCountry(null);
            return;
        }
        PhoneNumbers.Parsed parsed = PhoneNumbers.parse(raw);
        user.setPhone(parsed.e164());
        user.setCountry(parsed.country());
    }

    /** Recorded once, from the first visit that led to an account; later calls never overwrite it. */
    static void context(User user, SignupContext context) {
        if (context == null) return;
        if (user.getSignupPath() == null) user.setSignupPath(trimmed(context.path()));
        if (user.getSignupLanguage() == null) user.setSignupLanguage(trimmed(context.language()));
        if (user.getSignupTimezone() == null) user.setSignupTimezone(trimmed(context.timezone()));
    }

    private static String trimmed(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
