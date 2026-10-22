package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.AccountToken;
import com.brandonkamga.lescracks.account.domain.model.TokenPurpose;

import java.util.Optional;

public interface AccountTokenStore {

    Optional<AccountToken> findByHash(TokenPurpose purpose, String tokenHash);

    /** The latest link of this kind sent to the account, if any. */
    Optional<AccountToken> findLatest(Long accountId, TokenPurpose purpose);

    AccountToken save(AccountToken token);
}
