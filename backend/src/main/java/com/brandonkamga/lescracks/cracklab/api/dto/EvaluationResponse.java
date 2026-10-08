package com.brandonkamga.lescracks.cracklab.api.dto;

public record EvaluationResponse(Long criterionId, String label, int maxPoints, int points, String feedback) {
}
