package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.Arrival;
import jakarta.validation.constraints.Size;

/** Where and how someone arrived, sent by the browser once; never asked. */
public record SignupContext(@Size(max = 255) String path, @Size(max = 20) String language, @Size(max = 64) String timezone) {

    public Arrival toArrival() {
        return new Arrival(path, language, timezone);
    }
}
