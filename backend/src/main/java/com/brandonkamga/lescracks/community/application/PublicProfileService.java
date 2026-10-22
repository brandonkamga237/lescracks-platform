package com.brandonkamga.lescracks.community.application;

/** Public member profiles, shown when someone clicks a name. */
public interface PublicProfileService {

    /** An active member with a way to sign in; anyone else answers as not found. */
    PublicProfile require(Long memberId);
}
