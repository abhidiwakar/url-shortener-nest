import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeFullUrl } from '@url-shortener/shared';

export class CreateUrlDto {
  @ApiProperty({
    example: 'https://example.com/article',
    maxLength: 2048,
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return normalizeFullUrl(value) ?? value.trim();
  })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  fullUrl: string;

  @ApiPropertyOptional({
    example: 'launch-notes',
    description: 'Optional custom short code. Must match ^[a-zA-Z0-9_-]{3,64}$.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,64}$/)
  shortId?: string;
}
