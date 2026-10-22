package com.brandonkamga.lescracks.event.api.dto;

import com.brandonkamga.lescracks.event.application.ProjectDraft;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SubmissionRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 500) @Pattern(regexp = "^https?://\\S+$", message = "doit être un lien http(s)") String repositoryUrl,
        @Size(max = 500) @Pattern(regexp = "^$|^https?://\\S+$", message = "doit être un lien http(s)") String demoUrl,
        @NotBlank @Size(max = 5000) String description,
        @Size(max = 3) List<@Email String> teammateEmails) {

    public ProjectDraft toDraft() {
        return new ProjectDraft(title, repositoryUrl, demoUrl, description, teammateEmails == null ? List.of() : teammateEmails);
    }
}
