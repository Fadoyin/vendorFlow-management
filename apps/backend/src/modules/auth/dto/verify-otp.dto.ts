import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address associated with the OTP',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
    minLength: 6,
    maxLength: 6
  })
  @IsString({ message: 'OTP must be a string' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP must contain only numeric digits' })
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;

  @ApiProperty({
    description: 'Purpose of OTP verification',
    enum: ['signup', 'login'],
    example: 'login'
  })
  @IsString({ message: 'Purpose must be a string' })
  @IsIn(['signup', 'login'], { message: 'Purpose must be either signup or login' })
  @IsNotEmpty({ message: 'Purpose is required' })
  purpose: 'signup' | 'login';
} 