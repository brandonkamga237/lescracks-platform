package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.account.domain.model.AccountRenamed;

/** What account tells the rest of the platform; who listens is not its concern. */
public interface AccountEvents {

    void registered(AccountRegistered event);

    void renamed(AccountRenamed event);
}
