package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.AuthProvider;
import com.brandonkamga.lescracks.account.domain.model.ExternalIdentity;

import java.util.List;

/** The Google and GitHub sign-ins linked to a signed-in member's account. */
public interface ExternalIdentityService {

    List<ExternalIdentity> list(String email);

    ExternalIdentity link(String email, AuthProvider provider, String token);

    void unlink(String email, AuthProvider provider);
}
