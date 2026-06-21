import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IntegrationsModule } from '../integrations/integrations.module';
import {
  getPublicBaseUrl,
  buildIntegrationShortUrlExample,
} from './openapi-public-base-url';
import { patchOpenApiDocument } from './patch-openapi-document';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const publicBaseUrl = getPublicBaseUrl(
    configService.get<string>('PUBLIC_BASE_URL'),
  );
  const shortUrlExample = buildIntegrationShortUrlExample(publicBaseUrl);

  const config = new DocumentBuilder()
    .setTitle('Linkable Integration API')
    .setDescription(
      'Public API for third-party systems to shorten URLs and manage links in Linkable.\n\n' +
        'Authenticate with an API key via `X-API-Key` or `Authorization: Bearer <api-key>`. ' +
        'API keys are created and revoked from the Linkable web app — they are not managed through this API.\n\n' +
        `**Short link base URL:** \`${publicBaseUrl}\` (from \`PUBLIC_BASE_URL\`). ` +
        `Example response \`shortUrl\`: \`${shortUrlExample}\`.`,
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Integration API key issued from the Linkable web app.',
      },
      'api-key',
    )
    .addTag('Links', 'Create, list, archive, and restore short links.')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [IntegrationsModule],
  });

  patchOpenApiDocument(
    document as unknown as Record<string, unknown>,
    publicBaseUrl,
  );

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Linkable Integration API',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
