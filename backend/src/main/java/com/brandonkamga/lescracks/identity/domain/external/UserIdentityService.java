package com.brandonkamga.lescracks.identity.domain.external;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;

import java.util.List;

public interface UserIdentityService {

    List<UserIdentity> list(String email);

    UserIdentity link(String email, AuthProvider provider, String token);

    void unlink(String email, AuthProvider provider);
}
