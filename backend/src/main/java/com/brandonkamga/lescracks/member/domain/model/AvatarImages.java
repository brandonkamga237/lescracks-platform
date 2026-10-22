package com.brandonkamga.lescracks.member.domain.model;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

/**
 * What a profile photo may be. Checked on the bytes, not the declared type or the file name:
 * the file is served back from our own domain, so an HTML or SVG file posing as a photo would
 * run as a page of the site.
 */
public final class AvatarImages {
    static final int MAX_BYTES = 5 * 1024 * 1024;

    private AvatarImages() {
    }

    /** The content type to store the photo with; refuses anything that is not a JPEG, PNG or WebP. */
    public static String check(byte[] content) {
        if (content.length == 0) throw new BadRequestException("Aucun fichier reçu.");
        if (content.length > MAX_BYTES) throw new BadRequestException("La photo dépasse 5 Mo. Choisis une image plus légère.");
        if (startsWith(content, 0xFF, 0xD8, 0xFF)) return "image/jpeg";
        if (startsWith(content, 0x89, 'P', 'N', 'G')) return "image/png";
        if (content.length >= 12 && startsWith(content, 'R', 'I', 'F', 'F')
                && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') return "image/webp";
        throw new BadRequestException("Ce fichier n’est pas une photo. Choisis une image JPEG, PNG ou WebP.");
    }

    private static boolean startsWith(byte[] content, int... signature) {
        if (content.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((content[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }
}
