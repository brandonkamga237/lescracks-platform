package com.brandonkamga.lescracks.stats.api.dto;

public record ViewedResource(Long id, String slug, String title, String coverImage,
                             String category, long views) {
}
