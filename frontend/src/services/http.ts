import { ENV } from '@/config/env';
import { currentAccessToken } from '@/services/auth';

/** The error shape every failed request answers with. Mirrors ApiError on the backend. */
export interface ApiErrorBody {
  code: string;
  message: string;
  path?: string;
  fields?: Record<string, string>;
  reference?: string;
}

/**
 * A failure the caller can display.
 *
 * `message` is already written for a person to read — the backend composes it in French —
 * so a screen shows it as is rather than inventing its own wording, which would drift.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;
  readonly reference?: string;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message || 'Une erreur est survenue.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code || 'UNKNOWN';
    this.fields = body.fields;
    this.reference = body.reference;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }
}

type Query = Record<string, string | number | boolean | (string | number)[] | undefined | null>;

/** Skips empty values, so an untouched filter never becomes `?search=`. */
function queryString(query?: Query): string {
  if (!query) return '';

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      value.forEach((item) => params.append(key, String(item)));
    } else {
      params.append(key, String(value));
    }
  }

  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Multipart, for the two endpoints that take a file. */
  form?: FormData;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  // The token rides in the header, never in a cookie: the API is stateless and CSRF is not
  // a concern for a request the browser will not send on its own.
  const token = currentAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    // Content-Type is left unset on purpose: the browser adds the multipart boundary.
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(
    `${ENV.API_BASE_URL}${path}${queryString(options.query)}`,
    { method, headers, body, signal: options.signal },
  );

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, (payload ?? {}) as Partial<ApiErrorBody>);
  }
  return payload as T;
}

/** A proxy or gateway can answer html where json was expected; that is still an error. */
function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: 'Réponse illisible du serveur.' };
  }
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>('POST', path, { body, query }),
  postForm: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
  put: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>('PUT', path, { body, query }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
