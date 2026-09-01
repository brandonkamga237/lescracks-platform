/** Mirrors the ErrorCode enum on the API. */
export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'FORBIDDEN'
  | 'UNAUTHENTICATED'
  | 'CONFLICT'
  | 'DATA_CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'MALFORMED_REQUEST'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

/**
 * A failed request, with everything the API said about it.
 *
 * Throwing a bare Error kept only the sentence, so a caller wanting to react — send the user
 * back to sign-in, highlight the field at fault, show the reference — had to match on text.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  /** Quote this in a bug report; it is printed beside the stack trace server-side. */
  readonly reference?: string;
  /** Field name to message, present when code is VALIDATION_FAILED. */
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code?: ApiErrorCode,
    reference?: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.reference = reference;
    this.fieldErrors = fieldErrors;
  }

  /** True when signing in again is what would fix it. */
  get needsSignIn(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.status === 401;
  }

  /** True when the user cannot act on it and should be given the reference. */
  get isOurFault(): boolean {
    return this.code === 'INTERNAL_ERROR' || this.status >= 500;
  }
}

type ErrorBody = {
  message?: string;
  errorCode?: ApiErrorCode;
  reference?: string;
  data?: Record<string, string>;
};

/** Builds the error from a response body, whatever shape the server managed to return. */
export function apiErrorFrom(body: ErrorBody | null, status: number, fallback: string): ApiError {
  return new ApiError(
    body?.message || fallback,
    status,
    body?.errorCode,
    body?.reference,
    body?.errorCode === 'VALIDATION_FAILED' ? body?.data : undefined,
  );
}
