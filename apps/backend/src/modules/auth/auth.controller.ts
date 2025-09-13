import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 attempts per minute for development
  @ApiOperation({ 
    summary: 'Initiate user registration',
    description: 'Step 1: Validates user data and sends OTP for email verification'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        requiresOtp: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent successfully. Please check your email.' },
        expiresIn: { type: 'number', example: 300, description: 'OTP expiry time in seconds' },
        user: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            companyName: { type: 'string' },
            role: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors or password requirements not met'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - email already exists'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many registration attempts or OTP requests'
  })
  async register(@Body() registerDto: RegisterDto) {
    try {
      this.logger.log(`Registration attempt for email: ${registerDto.email}`);
      const result = await this.authService.initiateRegistration(registerDto);
      this.logger.log(`Registration OTP sent to: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`Registration failed for ${registerDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 attempts per minute for development
  @ApiOperation({ 
    summary: 'Initiate user login',
    description: 'Step 1: Validates credentials and sends OTP for two-factor authentication'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Credentials validated, OTP sent',
    schema: {
      type: 'object',
      properties: {
        requiresOtp: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent successfully. Please check your email.' },
        expiresIn: { type: 'number', example: 300, description: 'OTP expiry time in seconds' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials, inactive account, or unverified email'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many login attempts'
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      const result = await this.authService.initiateLogin(loginDto);
      this.logger.log(`Login OTP sent to: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`Login failed for ${loginDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 attempts per minute for development
  @ApiOperation({ 
    summary: 'Send or resend OTP',
    description: 'Sends a new OTP to the specified email for signup or login verification'
  })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'New OTP sent successfully. Please check your email.' },
        expiresIn: { type: 'number', example: 300, description: 'OTP expiry time in seconds' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - cooldown period active or no active OTP session'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Account locked due to too many failed attempts'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many OTP requests'
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    try {
      this.logger.log(`OTP resend request for email: ${sendOtpDto.email}, purpose: ${sendOtpDto.purpose}`);
      const result = await this.authService.sendOtp(sendOtpDto.email, sendOtpDto.purpose);
      this.logger.log(`OTP resent to: ${sendOtpDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`OTP resend failed for ${sendOtpDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 attempts per minute for development
  @ApiOperation({ 
    summary: 'Verify OTP and complete authentication',
    description: 'Verifies the OTP and completes either registration or login process'
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP verified successfully - authentication completed',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT access token' },
        refresh_token: { type: 'string', description: 'JWT refresh token' },
        token_type: { type: 'string', example: 'Bearer' },
        expires_in: { type: 'number', example: 900, description: 'Token expiry in seconds' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'vendor', 'supplier'] },
            companyName: { type: 'string' },
            status: { type: 'string' }
          }
        },
        message: { type: 'string', example: 'Authentication successful!' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid OTP, expired OTP, or OTP not found'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Account locked due to too many failed OTP attempts'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many verification attempts'
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      this.logger.log(`OTP verification attempt for email: ${verifyOtpDto.email}, purpose: ${verifyOtpDto.purpose}`);
      const result = await this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp, verifyOtpDto.purpose);
      this.logger.log(`OTP verified successfully for: ${verifyOtpDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`OTP verification failed for ${verifyOtpDto.email}: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 tests per minute
  @ApiOperation({ 
    summary: 'Test email delivery',
    description: 'Send a test OTP email to verify email service configuration'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'test@example.com' }
      },
      required: ['email']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Test email sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        testOtp: { type: 'string', description: 'Test OTP code for verification' },
        emailService: { type: 'object' }
      }
    }
  })
  async testEmail(@Body() body: { email: string }) {
    this.logger.log(`Test email request for: ${body.email}`);
    
    try {
      const result = await this.authService.sendTestEmail(body.email);
      this.logger.log(`Test email result for ${body.email}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      return {
        success: result.success,
        message: result.success 
          ? 'Test email sent successfully! Check your inbox and spam folder.' 
          : 'Failed to send test email. Check server logs for details.',
        testOtp: result.testOtp,
        emailService: result.emailService,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Test email failed for ${body.email}:`, error.message);
      return {
        success: false,
        message: 'Test email failed due to server error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async forgotPassword(@Body() body: any) {
    try {
      this.logger.log(`Forgot password request for: ${body.email}`);
      const result = await this.authService.forgotPassword(body.email);
      return result;
    } catch (error) {
      this.logger.error(`Forgot password error for ${body.email}:`, error);
      throw error;
    }
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  async resetPassword(@Body() body: any) {
    try {
      this.logger.log('Password reset attempt');
      const result = await this.authService.resetPassword(body.token, body.newPassword);
      this.logger.log('Password reset successful');
      return result;
    } catch (error) {
      this.logger.warn(`Password reset failed: ${error.message}`);
      throw error;
    }
  }
}
