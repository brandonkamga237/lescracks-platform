package com.brandonkamga.lescracks.event.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountDeleting;
import com.brandonkamga.lescracks.event.application.RegistrationService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Before the cascade removes a member's registrations, their events stop counting them. */
@Component("eventAccountDeletingListener")
public class AccountDeletingListener {

    private final RegistrationService registrations;

    public AccountDeletingListener(RegistrationService registrations) {
        this.registrations = registrations;
    }

    @EventListener
    public void releaseSeats(AccountDeleting event) {
        registrations.forgetMember(event.accountId());
    }
}
