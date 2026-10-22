package com.brandonkamga.lescracks.member.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.member.application.ProfileService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Keeps what the sign-up form asked beyond the account. Runs in the sign-up transaction. */
@Component
public class AccountRegisteredListener {

    private final ProfileService profiles;

    public AccountRegisteredListener(ProfileService profiles) {
        this.profiles = profiles;
    }

    @EventListener
    public void keepSignUpAnswers(AccountRegistered event) {
        boolean answered = (event.phone() != null && !event.phone().isBlank()) || event.marketingConsent() != null;
        if (answered) profiles.recordSignUp(event.accountId(), event.phone(), event.marketingConsent());
    }
}
