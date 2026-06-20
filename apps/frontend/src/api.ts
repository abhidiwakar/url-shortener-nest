import type {
  AuthResponse,
  AuthenticatedUser,
  ShortUrlConflictErrorBody,
  ShortUrlResponse,
} from '@url-shortener/shared';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
);
const PUBLIC_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_PUBLIC_BASE_URL ??
    (API_BASE_URL === '/api' ? window.location.origin : API_BASE_URL),
);

export type AuthUser = AuthenticatedUser;
export type ShortLink = ShortUrlResponse;
export type { AuthResponse, ShortUrlResponse };

export class ApiError extends Error {
  readonly status: number;
  readonly existingUrl?: ShortUrlResponse;

  constructor(message: string, status: number, existingUrl?: ShortUrlResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.existingUrl = existingUrl;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as
      | ShortUrlConflictErrorBody
      | { message?: string | string[] };

    const message = body.message;

    if (Array.isArray(message)) {
      return new ApiError(
        message.join(', '),
        response.status,
        'existingUrl' in body ? body.existingUrl : undefined,
      );
    }

    return new ApiError(
      message ?? `Request failed with status ${response.status}`,
      response.status,
      'existingUrl' in body ? body.existingUrl : undefined,
    );
  } catch {
    return new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

export function login(
  email: string,
  password: string,
  turnstileToken: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, turnstileToken }),
  });
}

export function register(
  email: string,
  password: string,
  turnstileToken: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, turnstileToken }),
  });
}

export function getLinks(
  token: string,
  archived = false,
): Promise<ShortUrlResponse[]> {
  return request<ShortUrlResponse[]>(
    `/urls${archived ? '?archived=true' : ''}`,
    {},
    token,
  );
}

export function createLink(
  token: string,
  fullUrl: string,
  shortId?: string,
): Promise<ShortUrlResponse> {
  return request<ShortUrlResponse>(
    '/urls',
    {
      method: 'POST',
      body: JSON.stringify({
        fullUrl,
        shortId: shortId?.trim() || undefined,
      }),
    },
    token,
  );
}

export function archiveLink(
  token: string,
  shortId: string,
): Promise<ShortUrlResponse> {
  return request<ShortUrlResponse>(
    `/urls/${shortId}/archive`,
    { method: 'PATCH' },
    token,
  );
}

export function unarchiveLink(
  token: string,
  shortId: string,
): Promise<ShortUrlResponse> {
  return request<ShortUrlResponse>(
    `/urls/${shortId}/unarchive`,
    { method: 'PATCH' },
    token,
  );
}

export function getShortUrl(shortId: string): string {
  return `${PUBLIC_BASE_URL}/${shortId}`;
}
