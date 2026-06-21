export const FULL_URL_MAX_LENGTH = 2048;

function isValidHostname(hostname: string): boolean {
  if (!hostname) {
    return false;
  }

  const lower = hostname.toLowerCase();

  if (lower === 'localhost') {
    return true;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return true;
  }

  if (!hostname.includes('.')) {
    return false;
  }

  const labels = hostname.split('.');

  if (labels.some((label) => !label || label.length > 63)) {
    return false;
  }

  if (labels[labels.length - 1].length < 2) {
    return false;
  }

  return (
    /^[a-z0-9.-]+$/i.test(hostname) &&
    !hostname.startsWith('.') &&
    !hostname.endsWith('.')
  );
}

export function normalizeFullUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > FULL_URL_MAX_LENGTH) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    if (!isValidHostname(parsed.hostname)) {
      return null;
    }

    if (/\s/.test(parsed.pathname + parsed.search + parsed.hash)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function isValidFullUrl(value: string): boolean {
  return normalizeFullUrl(value) !== null;
}
