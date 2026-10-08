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
    super(body.message || (status >= 500
      ? 'Le service est temporairement indisponible. Réessaie dans un instant.'
      : status === 401 ? 'Ta session a expiré. Reconnecte-toi pour continuer.'
        : status === 403 ? 'Tu n’as pas accès à cette action.' : 'Une erreur est survenue.'));
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

export type AuthTransport = 'cookie' | 'oidc';

const transportKey = 'lescracks.auth.transport';
let transport: AuthTransport = sessionStorage.getItem(transportKey) === 'oidc' ? 'oidc' : 'cookie';

export function getAuthTransport(): AuthTransport {
  return transport;
}

export function setAuthTransport(value: AuthTransport) {
  transport = value;
  sessionStorage.setItem(transportKey, value);
}

export type Query = Record<string, string | number | boolean | (string | number)[] | undefined | null>;

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
  transport?: AuthTransport;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  // The token rides in the header, never in a cookie: the API is stateless and CSRF is not
  // a concern for a request the browser will not send on its own.
  const cookieEndpoint = /^\/(?:admin\/)?auth\/(?:login|register|logout|forgot-password|reset-password)$/.test(path);
  const mode = cookieEndpoint ? 'cookie' : options.transport ?? getAuthTransport();
  const token = mode === 'oidc' ? currentAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.form) {
    // Content-Type is left unset on purpose: the browser adds the multipart boundary.
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const readOnly = method === 'GET';
  let timedOut = false;
  const cancel = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  const timer = window.setTimeout(() => {
    if (controller.signal.aborted) return;
    timedOut = true;
    controller.abort();
  }, readOnly ? 15_000 : 120_000);

  try {
    const response = await fetch(
      `${ENV.API_BASE_URL}${path}${queryString(options.query)}`,
      { method, headers, body, signal: controller.signal, credentials: mode === 'cookie' ? 'include' : 'omit' },
    );

    if (response.status === 204) return undefined as T;

    if (response.status === 401 && !/^\/(?:me|(?:admin\/)?auth(?:\/|$))/.test(path)) {
      window.dispatchEvent(new Event('lescracks:session-expired'));
    }

    const text = await response.text();
    let payload: unknown;
    try {
      payload = text ? safeParse(text) : null;
    } catch {
      throw new ApiError(response.ok ? 502 : response.status, { message: 'Le serveur a renvoyé une réponse illisible. Réessaie dans un instant.' });
    }

    if (!response.ok) {
      throw new ApiError(response.status, (payload ?? {}) as Partial<ApiErrorBody>);
    }
    if (payload === null) throw new ApiError(502, { message: 'Le serveur a renvoyé une réponse vide.' });
    return payload as T;
  } catch (cause) {
    if (timedOut) {
      throw new ApiError(408, {
        code: 'REQUEST_TIMEOUT',
        message: readOnly
          ? 'Le serveur met trop de temps à répondre. Réessaie dans un instant.'
          : 'Le délai de réponse est dépassé. Le résultat de ton action est incertain : vérifie si elle a été effectuée avant de réessayer.',
      });
    }
    throw cause;
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}

/** A proxy or gateway can answer html where json was expected; that is still an error. */
function safeParse(text: string): unknown {
  return JSON.parse(text);
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal, transport?: AuthTransport) =>
    request<T>('GET', path, { query, signal, transport }),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>('POST', path, { body, query }),
  postForm: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
  put: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>('PUT', path, { body, query }),
  putForm: <T>(path: string, form: FormData) => request<T>('PUT', path, { form }),
  patch: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>('PATCH', path, { body, query }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
