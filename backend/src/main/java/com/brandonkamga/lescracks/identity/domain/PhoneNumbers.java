package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;

/** International numbers only (+237…): the indicator is what tells us the member's country. */
public final class PhoneNumbers {

    private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();

    public record Parsed(String e164, String country) {
    }

    private PhoneNumbers() {
    }

    public static Parsed parse(String raw) {
        try {
            PhoneNumber number = UTIL.parse(raw.trim(), null);
            String country = UTIL.getRegionCodeForNumber(number);
            if (!UTIL.isValidNumber(number) || country == null) {
                throw invalid();
            }
            return new Parsed(UTIL.format(number, PhoneNumberUtil.PhoneNumberFormat.E164), country);
        } catch (NumberParseException parseFailure) {
            throw invalid();
        }
    }

    private static BadRequestException invalid() {
        return new BadRequestException("Ce numéro de téléphone n'est pas valide : vérifie l'indicatif du pays et le nombre de chiffres.");
    }
}
