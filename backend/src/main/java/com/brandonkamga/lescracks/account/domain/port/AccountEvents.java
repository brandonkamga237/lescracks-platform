package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;

/** What account tells the rest of the platform; who listens is not its concern. */
public interface AccountEvents {

    void registered(AccountRegistered event);
}
