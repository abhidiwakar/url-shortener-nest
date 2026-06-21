import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'Alex Morgan',
    maxLength: 80,
    description: 'Display name shown in your workspace.',
  })
  @IsString()
  @MaxLength(80)
  name: string;
}
