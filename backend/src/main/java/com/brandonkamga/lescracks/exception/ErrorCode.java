package com.brandonkamga.lescracks.exception;

/**
 * Stable identifiers for what went wrong.
 *
 * The message is French prose meant for a person and will be reworded; the code will not.
 * A client that needs to behave differently — retry, redirect to sign-in, highlight a field —
 * branches on this and never on the message text.
 */
public enum ErrorCode {
    /** The thing asked for does not exist. */
    NOT_FOUND,
    /** The request itself is wrong: a missing field, an impossible combination. */
    BAD_REQUEST,
    /** Field-level validation failed; `data` carries the field-to-message map. */
    VALIDATION_FAILED,
    /** Authenticated, but not allowed. */
    FORBIDDEN,
    /** Not authenticated, or the session has expired. */
    UNAUTHENTICATED,
    /** The state on the server conflicts with what the request assumes. */
    CONFLICT,
    /** Saving would break a database rule: a duplicate, or a row still referenced elsewhere. */
    DATA_CONFLICT,
    /** The upload is larger than the platform accepts. */
    PAYLOAD_TOO_LARGE,
    /** The body could not be read at all. */
    MALFORMED_REQUEST,
    /** Right route, wrong verb. */
    METHOD_NOT_ALLOWED,
    /** Anything not identified above. Carries a reference so the log can be found. */
    INTERNAL_ERROR,
}
