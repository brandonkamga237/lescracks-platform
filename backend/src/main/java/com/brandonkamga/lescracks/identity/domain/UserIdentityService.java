package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.api.dto.LinkIdentityRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserIdentityResponse;

import java.util.List;

public interface UserIdentityService {

    List<UserIdentityResponse> list(String email);

    UserIdentityResponse link(String email, LinkIdentityRequest request);

    void unlink(String email, AuthProvider provider);
}
