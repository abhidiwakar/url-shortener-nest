import { buildIntegrationShortUrlExample } from './openapi-public-base-url';

export function patchOpenApiDocument(
  document: Record<string, unknown>,
  publicBaseUrl: string,
): void {
  const shortUrlExample = buildIntegrationShortUrlExample(publicBaseUrl);
  const components = document.components as
    | {
        schemas?: Record<
          string,
          {
            properties?: Record<
              string,
              { example?: unknown; description?: string }
            >;
          }
        >;
      }
    | undefined;

  for (const schema of Object.values(components?.schemas ?? {})) {
    if (!schema?.properties?.shortUrl) {
      continue;
    }

    schema.properties.shortUrl.example = shortUrlExample;
    schema.properties.shortUrl.description =
      'Ready-to-use short link built from the server PUBLIC_BASE_URL setting.';
  }
}
