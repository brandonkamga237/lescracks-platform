package com.brandonkamga.lescracks.identity.domain;


import java.util.List;

public interface UserIdentityService {

    List<UserIdentity> list(String email);

    UserIdentity link(String email, AuthProvider provider, String token);

    void unlink(String email, AuthProvider provider);
}
