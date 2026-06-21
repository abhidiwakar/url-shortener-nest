import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    example: 'https://example.com/article',
    maxLength: 2048,
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
