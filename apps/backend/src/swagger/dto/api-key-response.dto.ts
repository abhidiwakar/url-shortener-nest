import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeySummaryDto {
  @ApiProperty({ example: '664f1f2bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Production integration' })
  name: string;

  @ApiProperty({ example: 'lnk_AbC12345' })
  keyPrefix: string;

  @ApiProperty({ example: '2026-06-20T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ nullable: true, example: '2026-06-20T13:15:00.000Z' })
  lastUsedAt: string | null;
}

export class CreateApiKeyResponseDto extends ApiKeySummaryDto {
  @ApiProperty({
    example: 'lnk_AbC12345abcdefghijklmnopqrstuvwxyz012345',
    description: 'Full API key. This value is only returned once at creation time.',
  })
  apiKey: string;
}
