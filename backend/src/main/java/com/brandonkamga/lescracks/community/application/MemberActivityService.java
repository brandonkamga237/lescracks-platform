package com.brandonkamga.lescracks.community.application;

public interface MemberActivityService {

    /** Whatever the member's status: a suspended member's history is what the admin needs to read. */
    MemberActivity view(Long memberId);
}
