package com.brandonkamga.lescracks.event.application;

import java.util.List;

/** What a member hands in: the project and the emails of the teammates named on it. */
public record ProjectDraft(String title, String repositoryUrl, String demoUrl, String description, List<String> teammateEmails) {
}
