package com.brandonkamga.lescracks.identity.domain.member;

/** Which optional parts the public profile shows; null leaves a choice as it is. */
public record ProfileVisibility(Boolean bio, Boolean location, Boolean links) {
}
