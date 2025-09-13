import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP to',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Purpose of OTP',
    enum: ['signup', 'login'],
    example: 'login'
  })
  @IsString({ message: 'Purpose must be a string' })
  @IsIn(['signup', 'login'], { message: 'Purpose must be either signup or login' })
  @IsNotEmpty({ message: 'Purpose is required' })
  purpose: 'signup' | 'login';
} 