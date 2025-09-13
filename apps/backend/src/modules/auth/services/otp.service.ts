import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../../users/schemas/user.schema';
import { EmailService } from '../../../common/email/email.service';

export interface OtpData {
  userId?: string;
  email: string;
  hashedOtp: string;
  attempts: number;
  expiresAt: Date;
  lockedUntil?: Date;
  purpose: 'signup' | 'login' | 'password_reset';
  createdAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStorage = new Map<string, OtpData>();
  private readonly sendCooldowns = new Map<string, Date>();
  
  // Configuration
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_MINUTES = 15;
  private readonly SEND_COOLDOWN_SECONDS = 10; // Reduced for development
  private readonly MAX_DAILY_ATTEMPTS = 10;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    // Clean up expired OTPs every 10 minutes
    setInterval(() => this.cleanupExpiredOtps(), 10 * 60 * 1000);
  }

  /**
   * Generate a 6-digit numeric OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash OTP for secure storage
   */
  private async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 12);
  }

  /**
   * Verify OTP against stored hash
   */
  private async verifyOtp(otp: string, hashedOtp: string): Promise<boolean> {
    return bcrypt.compare(otp, hashedOtp);
  }

  /**
   * Generate storage key for OTP data
   */
  private getStorageKey(email: string, purpose: string): string {
    return `${email.toLowerCase()}:${purpose}`;
  }

  /**
   * Check if user is in send cooldown period
   */
  private isInSendCooldown(email: string): boolean {
    const cooldownKey = `send:${email.toLowerCase()}`;
    const lastSent = this.sendCooldowns.get(cooldownKey);
    
    if (!lastSent) return false;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastSent.getTime();
    return timeDiff < this.SEND_COOLDOWN_SECONDS * 1000;
  }

  /**
   * Set send cooldown for user
   */
  private setSendCooldown(email: string): void {
    const cooldownKey = `send:${email.toLowerCase()}`;
    this.sendCooldowns.set(cooldownKey, new Date());
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(email: string): number {
    const cooldownKey = `send:${email.toLowerCase()}`;
    const lastSent = this.sendCooldowns.get(cooldownKey);
    
    if (!lastSent) {
      return 0; // No cooldown
    }
    
    const timeDiff = Date.now() - lastSent.getTime();
    const remaining = this.SEND_COOLDOWN_SECONDS - Math.floor(timeDiff / 1000);
    
    return Math.max(0, remaining);
  }

  /**
   * Check if user has exceeded daily attempt limits
   */
  private async checkDailyLimits(email: string): Promise<void> {
    // For production, implement proper daily tracking in Redis/DB
    // For now, we'll use a simple in-memory approach
    const dailyKey = `daily:${email.toLowerCase()}:${new Date().toDateString()}`;
    // This would be implemented with Redis in production
  }

  /**
   * Send OTP via email
   */
  private async sendOtp(email: string, otp: string, purpose: string): Promise<void> {
    try {
      // Always log OTP to console for development backup
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`🔐 OTP for ${email} (${purpose}): ${otp}`);
        this.logger.warn(`⚠️  Also sending to email: ${email}`);
      }

      // Send actual email
      const emailSent = await this.emailService.sendOtpEmail(email, otp, purpose as 'signup' | 'login');
      
      if (emailSent) {
        this.logger.log(`✅ OTP email sent successfully to ${email} for ${purpose}`);
      } else {
        this.logger.warn(`⚠️ Email sending failed, but OTP logged for development`);
      }

    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}:`, error);
      // In development, don't fail if email fails since we log to console
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException('Failed to send OTP. Please try again.');
      }
    }
  }

  /**
   * Generate and send OTP for signup
   */
  async sendSignupOtp(email: string, userData: any): Promise<{ message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase();
    
    // Check cooldown
    if (this.isInSendCooldown(normalizedEmail)) {
      throw new BadRequestException(`Please wait ${this.SEND_COOLDOWN_SECONDS} seconds before requesting another OTP`);
    }

    // Check daily limits
    await this.checkDailyLimits(normalizedEmail);

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.emailVerified) {
      throw new BadRequestException('Email already registered and verified');
    }

    // Generate OTP
    const otp = this.generateOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP data
    const storageKey = this.getStorageKey(normalizedEmail, 'signup');
    const otpData: OtpData = {
      email: normalizedEmail,
      hashedOtp,
      attempts: 0,
      expiresAt,
      purpose: 'signup',
      createdAt: new Date(),
    };

    this.otpStorage.set(storageKey, otpData);

    // Store user data temporarily (in production, use Redis)
    this.otpStorage.set(`${storageKey}:userdata`, userData);

    // Send OTP
    await this.sendOtp(normalizedEmail, otp, 'signup');
    this.setSendCooldown(normalizedEmail);

    this.logger.log(`Signup OTP sent to ${normalizedEmail}`);

    return {
      message: 'OTP sent successfully. Please check your email.',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60, // seconds
    };
  }

  /**
   * Generate and send OTP for login
   */
  async sendLoginOtp(email: string, userId: string): Promise<{ message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase();
    
    // Check cooldown
    if (this.isInSendCooldown(normalizedEmail)) {
      throw new BadRequestException(`Please wait ${this.SEND_COOLDOWN_SECONDS} seconds before requesting another OTP`);
    }

    // Check daily limits
    await this.checkDailyLimits(normalizedEmail);

    // Generate OTP
    const otp = this.generateOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP data
    const storageKey = this.getStorageKey(normalizedEmail, 'login');
    const otpData: OtpData = {
      userId,
      email: normalizedEmail,
      hashedOtp,
      attempts: 0,
      expiresAt,
      purpose: 'login',
      createdAt: new Date(),
    };

    this.otpStorage.set(storageKey, otpData);

    // Send OTP
    await this.sendOtp(normalizedEmail, otp, 'login');
    this.setSendCooldown(normalizedEmail);

    this.logger.log(`Login OTP sent to ${normalizedEmail}`);

    return {
      message: 'OTP sent successfully. Please check your email.',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60, // seconds
    };
  }

  /**
   * Verify OTP for signup and create user account
   */
  async verifySignupOtp(email: string, otp: string): Promise<any> {
    const normalizedEmail = email.toLowerCase();
    const storageKey = this.getStorageKey(normalizedEmail, 'signup');
    const otpData = this.otpStorage.get(storageKey);

    if (!otpData) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    // Check if locked
    if (otpData.lockedUntil && otpData.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((otpData.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedException(`Too many failed attempts. Try again in ${remainingTime} minutes.`);
    }

    // Check if expired
    if (otpData.expiresAt < new Date()) {
      this.otpStorage.delete(storageKey);
      this.otpStorage.delete(`${storageKey}:userdata`);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    const isValid = await this.verifyOtp(otp, otpData.hashedOtp);
    
    if (!isValid) {
      otpData.attempts += 1;
      
      // Lock after max attempts
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        otpData.lockedUntil = new Date(Date.now() + this.LOCKOUT_MINUTES * 60 * 1000);
        this.logger.warn(`Signup OTP locked for ${normalizedEmail} after ${this.MAX_ATTEMPTS} failed attempts`);
        throw new UnauthorizedException(`Too many failed attempts. Account locked for ${this.LOCKOUT_MINUTES} minutes.`);
      }

      this.otpStorage.set(storageKey, otpData);
      
      const remaining = this.MAX_ATTEMPTS - otpData.attempts;
      throw new BadRequestException(`Invalid OTP. ${remaining} attempts remaining.`);
    }

    // OTP verified - get user data and create account
    const userData = this.otpStorage.get(`${storageKey}:userdata`);
    if (!userData) {
      throw new BadRequestException('User data not found. Please start the signup process again.');
    }

    // Clean up OTP data
    this.otpStorage.delete(storageKey);
    this.otpStorage.delete(`${storageKey}:userdata`);

    this.logger.log(`Signup OTP verified successfully for ${normalizedEmail}`);

    return userData;
  }

  /**
   * Verify OTP for login
   */
  async verifyLoginOtp(email: string, otp: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    const storageKey = this.getStorageKey(normalizedEmail, 'login');
    const otpData = this.otpStorage.get(storageKey);

    if (!otpData) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    // Check if locked
    if (otpData.lockedUntil && otpData.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((otpData.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedException(`Too many failed attempts. Try again in ${remainingTime} minutes.`);
    }

    // Check if expired
    if (otpData.expiresAt < new Date()) {
      this.otpStorage.delete(storageKey);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    const isValid = await this.verifyOtp(otp, otpData.hashedOtp);
    
    if (!isValid) {
      otpData.attempts += 1;
      
      // Lock after max attempts
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        otpData.lockedUntil = new Date(Date.now() + this.LOCKOUT_MINUTES * 60 * 1000);
        this.logger.warn(`Login OTP locked for ${normalizedEmail} after ${this.MAX_ATTEMPTS} failed attempts`);
        throw new UnauthorizedException(`Too many failed attempts. Account locked for ${this.LOCKOUT_MINUTES} minutes.`);
      }

      this.otpStorage.set(storageKey, otpData);
      
      const remaining = this.MAX_ATTEMPTS - otpData.attempts;
      throw new BadRequestException(`Invalid OTP. ${remaining} attempts remaining.`);
    }

    // OTP verified - clean up and return user ID
    const userId = otpData.userId;
    this.otpStorage.delete(storageKey);

    this.logger.log(`Login OTP verified successfully for ${normalizedEmail}`);

    return userId;
  }

  /**
   * Resend OTP
   */
  async resendOtp(email: string, purpose: 'signup' | 'login'): Promise<{ message: string; expiresIn: number }> {
    const normalizedEmail = email.toLowerCase();
    
    // Check cooldown
    if (this.isInSendCooldown(normalizedEmail)) {
      const cooldownKey = `send:${normalizedEmail}`;
      const lastSent = this.sendCooldowns.get(cooldownKey);
      const remainingTime = this.SEND_COOLDOWN_SECONDS - Math.floor((Date.now() - lastSent.getTime()) / 1000);
      throw new BadRequestException(`Please wait ${remainingTime} seconds before requesting another OTP`);
    }

    const storageKey = this.getStorageKey(normalizedEmail, purpose);
    const otpData = this.otpStorage.get(storageKey);

    if (!otpData) {
      throw new BadRequestException('No active OTP session found. Please start the process again.');
    }

    // Check if locked
    if (otpData.lockedUntil && otpData.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((otpData.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      throw new UnauthorizedException(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    // Generate new OTP
    const otp = this.generateOtp();
    const hashedOtp = await this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update OTP data
    otpData.hashedOtp = hashedOtp;
    otpData.expiresAt = expiresAt;
    otpData.attempts = 0; // Reset attempts for new OTP
    otpData.createdAt = new Date();

    this.otpStorage.set(storageKey, otpData);

    // Send new OTP
    await this.sendOtp(normalizedEmail, otp, purpose);
    this.setSendCooldown(normalizedEmail);

    this.logger.log(`OTP resent to ${normalizedEmail} for ${purpose}`);

    return {
      message: 'New OTP sent successfully. Please check your email.',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60,
    };
  }

  /**
   * Clean up expired OTPs and cooldowns
   */
  private cleanupExpiredOtps(): void {
    const now = new Date();
    let cleanedCount = 0;

    // Clean expired OTPs
    for (const [key, otpData] of this.otpStorage.entries()) {
      if (typeof otpData === 'object' && otpData.expiresAt && otpData.expiresAt < now) {
        this.otpStorage.delete(key);
        // Also clean associated user data for signup
        if (key.includes(':signup')) {
          this.otpStorage.delete(`${key}:userdata`);
        }
        cleanedCount++;
      }
    }

    // Clean expired cooldowns
    let cooldownCleaned = 0;
    for (const [key, lastSent] of this.sendCooldowns.entries()) {
      const timeDiff = now.getTime() - lastSent.getTime();
      if (timeDiff > this.SEND_COOLDOWN_SECONDS * 1000) {
        this.sendCooldowns.delete(key);
        cooldownCleaned++;
      }
    }

    if (cleanedCount > 0 || cooldownCleaned > 0) {
      this.logger.debug(`Cleanup: Removed ${cleanedCount} expired OTPs and ${cooldownCleaned} expired cooldowns`);
    }
  }

  /**
   * Get OTP status for debugging (development only)
   */
  getOtpStatus(email: string, purpose: string): any {
    if (process.env.NODE_ENV !== 'development') {
      return { message: 'OTP status only available in development mode' };
    }

    const storageKey = this.getStorageKey(email, purpose);
    const otpData = this.otpStorage.get(storageKey);
    
    if (!otpData) {
      return { status: 'No active OTP' };
    }

    return {
      status: 'Active',
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      isLocked: otpData.lockedUntil && otpData.lockedUntil > new Date(),
      lockedUntil: otpData.lockedUntil,
    };
  }
} 