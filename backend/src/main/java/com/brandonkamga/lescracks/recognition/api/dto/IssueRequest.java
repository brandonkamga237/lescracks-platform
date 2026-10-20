package com.brandonkamga.lescracks.recognition.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record IssueRequest(@NotEmpty @Size(max = 500) List<Long> ids) {
}
