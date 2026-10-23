package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.application.BulkAward;

import java.util.List;

public record BulkAwardResponse(int awarded, int alreadyHeld, List<String> unknownEmails) {

    public static BulkAwardResponse of(BulkAward award) {
        return new BulkAwardResponse(award.awarded(), award.alreadyHeld(), award.unknownEmails());
    }
}
