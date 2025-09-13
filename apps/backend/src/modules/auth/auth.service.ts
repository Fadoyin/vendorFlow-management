import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import { User, UserRole, UserStatus } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { OtpService } from './services/otp.service';
import { EmailService } from '../../common/email/email.service';
import { Supplier } from '../../common/schemas/supplier.schema';
import { Vendor } from '../../common/schemas/vendor.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  /**
   * Smart tenant assignment: Join existing company or create new tenant
   * This enables multiple users to join the same company automatically
   */
  private async getOrCreateTenantId(companyName: string, userRole: string, inviteCode?: string): Promise<Types.ObjectId> {
    try {
      // 1. Priority: Check invite code first (most explicit)
      if (inviteCode && inviteCode.trim()) {
        const inviteUser = await this.findUserByInviteCode(inviteCode.trim());
        if (inviteUser) {
          this.logger.log(`Joining tenant via invite code: ${inviteCode} (tenantId: ${inviteUser.tenantId})`);
          this.logger.log(`${userRole} joining company: ${inviteUser.companyName} via invite from: ${inviteUser.email}`);
          return inviteUser.tenantId;
        } else {
          this.logger.warn(`Invalid invite code provided: ${inviteCode}`);
          // Continue with company name matching as fallback
        }
      }

      // 2. Fallback: Company name matching
      // Normalize company name for matching (case-insensitive, trimmed)
      const normalizedCompanyName = companyName.toLowerCase().trim();
      
      // Skip tenant matching for test/demo companies to avoid conflicts
      const skipMatchingPatterns = ['test', 'demo', 'example', 'sample'];
      const shouldSkipMatching = skipMatchingPatterns.some(pattern => 
        normalizedCompanyName.includes(pattern)
      );
      
      if (shouldSkipMatching) {
        this.logger.log(`Creating new tenant for test/demo company: ${companyName}`);
        return new Types.ObjectId();
      }
      
      // Look for existing active users with the same company name
      const existingUser = await this.userModel.findOne({
        companyName: { $regex: new RegExp(`^${normalizedCompanyName}$`, 'i') },
        status: UserStatus.ACTIVE, // Only match active users
        isActive: true
      }).sort({ createdAt: 1 }); // Get the oldest user (original company creator)
      
      if (existingUser) {
        this.logger.log(`Joining existing tenant for company: ${companyName} (tenantId: ${existingUser.tenantId})`);
        
        // Log which user is joining which company for audit
        this.logger.log(`New ${userRole} joining company founded by: ${existingUser.email} (${existingUser.role})`);
        
        return existingUser.tenantId;
      } else {
        // No existing company found, create new tenant
        const newTenantId = new Types.ObjectId();
        this.logger.log(`Creating new tenant for company: ${companyName} (tenantId: ${newTenantId})`);
        return newTenantId;
      }
    } catch (error) {
      // Fallback to creating new tenant if there's any error
      this.logger.error(`Error in smart tenant assignment: ${error.message}, creating new tenant`);
      return new Types.ObjectId();
    }
  }

  /**
   * Find user by invite code for tenant joining
   * Simple implementation: invite code is the user's email or a generated code
   */
  private async findUserByInviteCode(inviteCode: string): Promise<User | null> {
    try {
      // For now, invite code can be:
      // 1. Email of an existing user (simple approach)
      // 2. Company name (case-insensitive)
      // 3. Future: dedicated invite codes stored in database
      
      // Try email first
      const userByEmail = await this.userModel.findOne({
        email: inviteCode.toLowerCase(),
        status: UserStatus.ACTIVE,
        isActive: true
      });
      
      if (userByEmail) {
        return userByEmail;
      }
      
      // Try company name
      const userByCompany = await this.userModel.findOne({
        companyName: { $regex: new RegExp(`^${inviteCode}$`, 'i') },
        status: UserStatus.ACTIVE,
        isActive: true
      }).sort({ createdAt: 1 }); // Get the first user from that company
      
      return userByCompany;
    } catch (error) {
      this.logger.error(`Error finding user by invite code: ${error.message}`);
      return null;
    }
  }

  /**
   * Auto-create supplier record when supplier user registers
   * This ensures vendors can see suppliers in the create order modal
   */
  private async createSupplierRecord(user: User): Promise<void> {
    try {
      const supplierCode = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const supplierData = {
        supplierName: `${user.firstName} ${user.lastName}`,
        supplierCode: supplierCode,
        category: 'other', // Default category
        companyName: user.companyName,
        email: user.email,
        contactPerson: `${user.firstName} ${user.lastName}`,
        phone: '', // Will be empty initially
        address: '', // Will be empty initially
        website: '', // Will be empty initially
        taxId: '', // Will be empty initially
        status: 'active',
        rating: 5, // Default rating
        totalOrders: 0,
        totalValue: 0,
        paymentTerms: 'Net 30', // Default payment terms
        currency: 'USD',
        categories: [], // Will be empty initially
        documents: [],
        performance: {
          onTimeDelivery: 100,
          qualityScore: 100,
          responseTime: 24,
        },
        isPreferred: false,
      };

      const newSupplier = new this.supplierModel({
        ...supplierData,
        tenantId: user.tenantId,
      });
      await newSupplier.save();

      this.logger.log(`Auto-created supplier record for user: ${user.email} in tenant: ${user.tenantId}`);
    } catch (error) {
      // Don't fail user registration if supplier record creation fails
      this.logger.error(`Failed to auto-create supplier record for ${user.email}: ${error.message}`);
    }
  }

  /**
   * Auto-create vendor record when vendor user registers
   * This ensures suppliers can see vendors in the create order modal
   */
  private async createVendorRecord(user: User): Promise<void> {
    try {
      const vendorCode = `VEN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const vendorData = {
        name: `${user.firstName} ${user.lastName}`,
        vendorCode: vendorCode,
        category: 'other', // Default category
        status: 'active',
        description: `Auto-created vendor for ${user.companyName}`,
        website: '',
        address: {
          street: 'Not provided',
          city: 'Not provided', 
          state: 'Not provided',
          zipCode: '00000',
          country: 'Not provided',
          additionalInfo: ''
        },
        contacts: [{
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: '',
          jobTitle: 'Primary Contact',
          isPrimary: true
        }],
        paymentTerms: 'net_30',
        creditLimit: 0,
        currentBalance: 0,
        taxId: '',
        registrationNumber: '',
        certifications: [],
        capabilities: [],
        documents: [],
        performance: {
          qualityScore: 100,
          deliveryScore: 100,
          communicationScore: 100,
          overallRating: 5.0,
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          averageLeadTime: 0,
          onTimeDeliveryRate: 100
        },
        items: [],
        purchaseOrders: [],
        customFields: {},
        notes: 'Auto-created during user registration',
        tags: [],
      };

      const newVendor = new this.vendorModel({
        ...vendorData,
        tenantId: user.tenantId,
      });
      await newVendor.save();

      this.logger.log(`Auto-created vendor record for user: ${user.email} in tenant: ${user.tenantId}`);
    } catch (error) {
      // Don't fail user registration if vendor record creation fails
      this.logger.error(`Failed to auto-create vendor record for ${user.email}: ${error.message}`);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      const result = user.toObject();
      delete result.password;
      return result;
    }
    return null;
  }

  /**
   * Step 1 of login: Validate credentials and send OTP
   */
  async initiateLogin(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive || user.status !== UserStatus.ACTIVE) {
      this.logger.warn(`Login attempt for inactive user: ${email}`);
      throw new UnauthorizedException('Account is not active. Please contact support.');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      this.logger.warn(`Login attempt for unverified user: ${email}`);
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // 2FA is enabled - send OTP for second factor
      const otpResult = await this.otpService.sendLoginOtp(email, user._id.toString());

      this.logger.log(`Login OTP initiated for user with 2FA: ${email}`);

      return {
        requiresOtp: true,
        twoFactorRequired: true,
        message: otpResult.message,
        expiresIn: otpResult.expiresIn,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } else {
      // 2FA is not enabled - log in directly
      this.logger.log(`Direct login for user without 2FA: ${email}`);

      // Update last login
      await this.userModel.updateOne(
        { _id: user._id },
        { 
          lastLoginAt: new Date(),
          $inc: { loginCount: 1 }
        },
      );

      // Generate tokens
      const tokenFamily = uuidv4();
      const jti = uuidv4();

      // Access token payload
      const accessPayload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        tenantId: user.tenantId.toString(),
        companyName: user.companyName,
        vendorProfile: user.vendorProfile?.toString(),
        jti,
      };

      // Refresh token payload
      const refreshPayload: RefreshTokenPayload = {
        sub: user._id.toString(),
        email: user.email,
        tokenFamily,
        jti: uuidv4(),
      };

      const accessToken = this.jwtService.sign(accessPayload);
      const refreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 
                this.configService.get<string>('JWT_SECRET') + '_refresh',
      });

      // Store refresh token family
      await this.userModel.updateOne(
        { _id: user._id },
        { $addToSet: { refreshTokenFamilies: tokenFamily } }
      );

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 900, // 15 minutes in seconds
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyName: user.companyName,
          status: user.status,
        },
        message: 'Login successful! Welcome back.',
      };
    }
  }

  /**
   * Step 2 of login: Verify OTP and complete login
   */
  async completeLogin(email: string, otp: string) {
    // Verify OTP
    const userId = await this.otpService.verifyLoginOtp(email, otp);

    // Get user details
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update last login
    await this.userModel.updateOne(
      { _id: user._id },
      { 
        lastLoginAt: new Date(),
        $inc: { loginCount: 1 }
      },
    );

    // Generate tokens
    const tokenFamily = uuidv4();
    const jti = uuidv4();

    // Access token payload
    const accessPayload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId.toString(),
      companyName: user.companyName,
      vendorProfile: user.vendorProfile?.toString(),
      jti,
    };

    // Refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      tokenFamily,
      jti: uuidv4(),
    };

    const accessToken = this.jwtService.sign(accessPayload);
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d', // Longer-lived refresh tokens
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 
              this.configService.get<string>('JWT_SECRET') + '_refresh',
    });

    // Store refresh token family in user record for revocation tracking
    await this.userModel.updateOne(
      { _id: user._id },
      { $addToSet: { refreshTokenFamilies: tokenFamily } }
    );

    this.logger.log(`Successful login for user: ${email}`);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes in seconds
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companyName,
        status: user.status,
      },
    };
  }

  /**
   * Legacy login method (kept for backward compatibility)
   */
  async login(loginDto: LoginDto) {
    // For now, redirect to the new OTP flow
    return this.initiateLogin(loginDto);
  }

  /**
   * Step 1 of registration: Validate data and send OTP
   */
  async initiateRegistration(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, companyName, role, inviteCode } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new ConflictException('Email already registered. Please use a different email or try logging in.');
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Hash password for temporary storage
    const saltRounds = 14;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Smart tenant assignment - join existing company or create new one
    const tenantId = await this.getOrCreateTenantId(companyName.trim(), role, inviteCode);

    // Prepare user data for temporary storage
    const userData = {
      tenantId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName.trim(),
      role: role || UserRole.VENDOR,
      status: UserStatus.PENDING, // Will be ACTIVE after OTP verification
      isActive: false, // Will be true after OTP verification
      emailVerified: false, // Will be true after OTP verification
      permissions: [],
      refreshTokenFamilies: [],
      loginCount: 0,
    };

    // Send OTP
    const otpResult = await this.otpService.sendSignupOtp(email, userData);

    this.logger.log(`Registration OTP initiated for user: ${email}`);

    return {
      requiresOtp: true,
      message: otpResult.message,
      expiresIn: otpResult.expiresIn,
      user: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        role: role || UserRole.VENDOR,
      },
    };
  }

  /**
   * Step 2 of registration: Verify OTP and create account
   */
  async completeRegistration(email: string, otp: string) {
    // Verify OTP and get user data
    const userData = await this.otpService.verifySignupOtp(email, otp);

    // Activate the user account
    userData.status = UserStatus.ACTIVE;
    userData.isActive = true;
    userData.emailVerified = true;

    try {
      const newUser = new this.userModel(userData);
      const savedUser = await newUser.save();
      
      this.logger.log(`New user registered and verified: ${email} with role: ${userData.role}`);

      // Auto-create supplier record if user role is supplier
      if (userData.role === UserRole.SUPPLIER) {
        await this.createSupplierRecord(savedUser);
      }

      // Auto-create vendor record if user role is vendor
      if (userData.role === UserRole.VENDOR) {
        await this.createVendorRecord(savedUser);
      }

      // Generate initial tokens for immediate login
      const tokenFamily = uuidv4();
      const jti = uuidv4();

      const accessPayload: JwtPayload = {
        sub: savedUser._id.toString(),
        email: savedUser.email,
        role: savedUser.role,
        tenantId: savedUser.tenantId.toString(),
        companyName: savedUser.companyName,
        vendorProfile: savedUser.vendorProfile?.toString(),
        jti,
      };

      const refreshPayload: RefreshTokenPayload = {
        sub: savedUser._id.toString(),
        email: savedUser.email,
        tokenFamily,
        jti: uuidv4(),
      };

      const accessToken = this.jwtService.sign(accessPayload);
      const refreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 
                this.configService.get<string>('JWT_SECRET') + '_refresh',
      });

      // Store refresh token family
      await this.userModel.updateOne(
        { _id: savedUser._id },
        { $addToSet: { refreshTokenFamilies: tokenFamily } }
      );

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 900,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          companyName: savedUser.companyName,
          status: savedUser.status,
        },
        message: 'Registration completed successfully! Welcome to VendorFlow.',
      };
    } catch (error) {
      this.logger.error(`Registration completion failed for ${email}:`, error);

      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new ConflictException('Email already exists. Please use a different email.');
      }

      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  /**
   * Legacy registration method (kept for backward compatibility)
   */
  async register(registerDto: RegisterDto) {
    // For now, redirect to the new OTP flow
    return this.initiateRegistration(registerDto);
  }

  /**
   * Send OTP (unified endpoint for resending)
   */
  async sendOtp(email: string, purpose: 'signup' | 'login') {
    return this.otpService.resendOtp(email, purpose);
  }

  /**
   * Verify OTP (unified endpoint)
   */
  async verifyOtp(email: string, otp: string, purpose: 'signup' | 'login') {
    if (purpose === 'signup') {
      return this.completeRegistration(email, otp);
    } else if (purpose === 'login') {
      return this.completeLogin(email, otp);
    } else {
      throw new BadRequestException('Invalid OTP purpose');
    }
  }

  /**
   * Send test email to verify email service configuration
   */
  async sendTestEmail(email: string): Promise<{
    success: boolean;
    testOtp: string;
    emailService: any;
  }> {
    this.logger.log(`Sending test email to: ${email}`);
    
    // Generate a test OTP
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      // Get email service info
      const emailService = this.emailService.getServiceInfo();
      
      // Send test email
      const emailSent = await this.emailService.sendOtpEmail(email, testOtp, 'signup');
      
      this.logger.log(`Test email ${emailSent ? 'sent successfully' : 'failed'} to: ${email}`);
      
      return {
        success: emailSent,
        testOtp: emailSent ? testOtp : 'Email failed - check logs',
        emailService
      };
    } catch (error) {
      this.logger.error(`Test email failed for ${email}:`, error.message);
      return {
        success: false,
        testOtp: 'Error occurred',
        emailService: { error: error.message }
      };
    }
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strengthCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (strengthCount < 3) {
      throw new BadRequestException(
        'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, special characters'
      );
    }

    // Optional: Log weak passwords for monitoring
    if (strengthCount < 4) {
      console.warn('Password is weak - consider adding uppercase, lowercase, numbers, or special characters');
    }
  }


  /**
   * Initiate password reset by sending reset email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      this.logger.log(`Password reset requested for email: ${email}`);
      
      const user = await this.userModel.findOne({ 
        email: email.toLowerCase(),
        status: UserStatus.ACTIVE 
      });

      // Always return success message for security (don't reveal if email exists)
      const successMessage = 'If an account with that email exists, a password reset link has been sent.';

      if (!user) {
        this.logger.warn(`Password reset requested for non-existent email: ${email}`);
        return { message: successMessage };
      }

      // Generate secure reset token (JWT with short expiry)
      const resetToken = this.jwtService.sign(
        { 
          sub: user._id.toString(),
          email: user.email,
          type: 'password_reset'
        },
        { 
          expiresIn: '15m', // 15 minutes
          issuer: 'vendorflow-api',
          audience: 'password-reset'
        }
      );

      // Store token hash and expiry in database
      const tokenExpiry = new Date();
      tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 15);

      await this.userModel.updateOne(
        { _id: user._id },
        {
          passwordResetToken: await bcrypt.hash(resetToken, 10),
          passwordResetExpires: tokenExpiry
        }
      );

      // Send reset email
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005';
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      try {
        await this.emailService.sendEmail(
          user.email,
          'Password Reset Request - VendorFlow',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3B82F6;">Password Reset Request</h2>
              <p>Hello ${user.firstName},</p>
              <p>You requested to reset your password for your VendorFlow account.</p>
              <p>Click the link below to reset your password:</p>
              <div style="margin: 20px 0;">
                <a href="${resetLink}" 
                   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                This link will expire in 15 minutes for security reasons.
              </p>
              <p style="color: #666; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
              </p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                VendorFlow - Smart Vendor & Inventory Management
              </p>
            </div>
          `
        );
        this.logger.log(`Password reset email sent to: ${email}`);
      } catch (emailError) {
        this.logger.error(`Failed to send password reset email to ${email}:`, emailError);
        // Don't throw error - still return success for security
      }

      return { message: successMessage };
    } catch (error) {
      this.logger.error('Forgot password error:', error);
      throw new BadRequestException('Unable to process password reset request');
    }
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      this.logger.log('Password reset attempt with token');

      // Verify and decode the JWT token
      let decodedToken;
      try {
        decodedToken = this.jwtService.verify(token, {
          issuer: 'vendorflow-api',
          audience: 'password-reset'
        });
      } catch (jwtError) {
        this.logger.warn('Invalid or expired reset token');
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (decodedToken.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      // Find user and verify token
      const user = await this.userModel.findOne({
        _id: decodedToken.sub,
        email: decodedToken.email,
        passwordResetExpires: { $gt: new Date() },
        status: UserStatus.ACTIVE
      });

      if (!user || !user.passwordResetToken) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Verify token hash
      const tokenValid = await bcrypt.compare(token, user.passwordResetToken);
      if (!tokenValid) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password and clear reset token
      await this.userModel.updateOne(
        { _id: user._id },
        {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          failedLoginAttempts: 0, // Reset failed attempts
          lockedUntil: null // Clear account lock if any
        }
      );

      this.logger.log(`Password reset successful for user: ${user.email}`);

      // Send confirmation email
      try {
        await this.emailService.sendEmail(
          user.email,
          'Password Reset Confirmation - VendorFlow',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">Password Reset Successful</h2>
              <p>Hello ${user.firstName},</p>
              <p>Your password has been successfully reset for your VendorFlow account.</p>
              <p>If you didn't perform this action, please contact our support team immediately.</p>
              <div style="margin: 20px 0;">
                <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3005'}/login" 
                   style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Login to VendorFlow
                </a>
              </div>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                VendorFlow - Smart Vendor & Inventory Management
              </p>
            </div>
          `
        );
      } catch (emailError) {
        this.logger.error(`Failed to send password reset confirmation to ${user.email}:`, emailError);
      }

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Reset password error:', error);
      throw new BadRequestException('Unable to reset password');
    }
  }
}
