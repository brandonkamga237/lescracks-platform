package com.brandonkamga.lescracks.engagement.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountDeleting;
import com.brandonkamga.lescracks.engagement.application.ReactionService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Before the cascade removes a member's likes, the like counts stop including them. */
@Component("engagementAccountDeletingListener")
public class AccountDeletingListener {

    private final ReactionService reactions;

    public AccountDeletingListener(ReactionService reactions) {
        this.reactions = reactions;
    }

    @EventListener
    public void releaseLikes(AccountDeleting event) {
        reactions.forgetMember(event.accountId());
    }
}
