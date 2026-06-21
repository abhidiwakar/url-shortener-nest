import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { buildIntegrationShortUrlExample } from '../openapi-public-base-url';

export class ShortUrlResponseDto {
  @ApiProperty({ example: '664f1f2bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'https://example.com/article' })
  fullUrl: string;

  @ApiProperty({ example: 'launch-notes' })
  shortId: string;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiProperty({
    nullable: true,
    example: null,
  })
  archivedAt: string | null;
}

export class IntegrationShortUrlResponseDto extends ShortUrlResponseDto {
  @ApiProperty({
    example: buildIntegrationShortUrlExample(process.env.PUBLIC_BASE_URL),
    description:
      'Ready-to-use short link built from the server PUBLIC_BASE_URL setting.',
  })
  shortUrl: string;
}

export class ShortUrlConflictErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'You have already shortened this URL' })
  message: string;

  @ApiProperty({ type: ShortUrlResponseDto })
  existingUrl: ShortUrlResponseDto;
}

export class RedirectJsonResponseDto {
  @ApiProperty({ example: 'launch-notes' })
  shortId: string;

  @ApiProperty({ example: 'https://example.com/article' })
  fullUrl: string;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiProperty({ nullable: true, example: null })
  archivedAt: string | null;
}
