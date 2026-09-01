package com.brandonkamga.lescracks.exception;

/**
 * A stable name for what went wrong.
 *
 * The message is French prose written for a person, and it will be reworded. This will not.
 * A client that needs to behave differently — retry, send someone to sign in, highlight a
 * field — branches on this and never on the sentence.
 */
public enum ErrorCode {
    NOT_FOUND,
    BAD_REQUEST,
    /** Field validation failed; the payload carries the field-to-message map. */
    VALIDATION_FAILED,
    /** The state on the server contradicts what the request assumed. */
    CONFLICT,
    /** Saving would break a database rule: a duplicate, or a row still referenced. */
    DATA_CONFLICT,
    FORBIDDEN,
    UNAUTHENTICATED,
    PAYLOAD_TOO_LARGE,
    MALFORMED_REQUEST,
    METHOD_NOT_ALLOWED,
    /** Something broke on our side. Carries a reference so the log line can be found. */
    INTERNAL_ERROR,
}
