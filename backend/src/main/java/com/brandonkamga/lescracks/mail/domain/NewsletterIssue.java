package com.brandonkamga.lescracks.mail.domain;

import com.fasterxml.jackson.databind.JsonNode;

/** A newsletter written in the back office; {{firstName}}, {{lastName}} and {{email}} are filled per reader. */
public record NewsletterIssue(String to, String subject, JsonNode body, String firstName, String lastName) implements Email {
}
