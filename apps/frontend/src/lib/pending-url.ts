import {
  normalizeFullUrl,
  isValidFullUrl,
  FULL_URL_MAX_LENGTH,
} from './url-validation';

export {
  FULL_URL_MAX_LENGTH,
  isValidFullUrl,
  normalizeFullUrl,
};

export const PENDING_URL_QUERY_PARAM = 'url';
export const PENDING_URL_STORAGE_KEY = 'moklay_pending_url';

export function normalizePendingUrl(value: string): string | null {
  return normalizeFullUrl(value);
}

export function buildUrlWithPendingParam(pathname: string, url: string): string {
  const params = new URLSearchParams();
  params.set(PENDING_URL_QUERY_PARAM, url);

  return `${pathname}?${params.toString()}`;
}

export function readPendingUrlFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const raw = params.get(PENDING_URL_QUERY_PARAM);

  if (!raw) {
    return null;
  }

  return normalizePendingUrl(raw);
}

export function savePendingUrl(url: string): void {
  sessionStorage.setItem(PENDING_URL_STORAGE_KEY, url);
}

export function getPendingUrl(): string | null {
  return sessionStorage.getItem(PENDING_URL_STORAGE_KEY);
}

export function clearPendingUrl(): void {
  sessionStorage.removeItem(PENDING_URL_STORAGE_KEY);
}

export function resolvePendingUrl(search: string): string | null {
  return readPendingUrlFromSearch(search) ?? getPendingUrl();
}
