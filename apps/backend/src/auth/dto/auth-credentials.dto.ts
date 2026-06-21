import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    example: 'XXXX.DUMMY.TOKEN.XXXX',
    description: 'Cloudflare Turnstile verification token.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  turnstileToken: string;
}
