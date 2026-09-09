package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.dto.auth.LinkIdentityRequest;
import com.brandonkamga.lescracks.dto.user.UserIdentityResponse;

import java.util.List;

public interface UserIdentityService {

    List<UserIdentityResponse> list(String email);

    UserIdentityResponse link(String email, LinkIdentityRequest request);

    void unlink(String email, AuthProvider provider);
}
