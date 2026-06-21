export function getPublicBaseUrl(configured?: string | null): string {
  return configured?.replace(/\/$/, '') ?? 'http://localhost:8080';
}

export function buildIntegrationShortUrlExample(
  configuredBaseUrl?: string | null,
  shortId = 'launch-notes',
): string {
  return `${getPublicBaseUrl(configuredBaseUrl)}/${shortId}`;
}
