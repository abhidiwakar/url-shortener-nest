function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function getOpenApiSpecUrl(): string {
  const apiUrl = normalizeBaseUrl(
    import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  );

  if (apiUrl.startsWith('/')) {
    return `${window.location.origin}${apiUrl}/docs-json`;
  }

  return `${apiUrl}/docs-json`;
}

export function getDevelopersUrl(): string {
  return `${window.location.origin}/developers`;
}
