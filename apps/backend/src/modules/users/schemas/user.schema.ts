import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  SUPPLIER = 'supplier',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, type: Types.ObjectId })
  tenantId: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.VENDOR })
  role: UserRole;

  @Prop({ required: true, enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Prop()
  companyName?: string;

  @Prop()
  phone?: string;

  @Prop()
  department?: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  businessType?: string;

  @Prop()
  taxId?: string;

  @Prop()
  website?: string;

  @Prop()
  address?: string;

  @Prop()
  streetAddress?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  country?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorProfile?: Types.ObjectId;

  @Prop()
  stripeCustomerId?: string;

  @Prop({ default: true })
  isActive: boolean;

  // 2FA Fields
  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret?: string; // Encrypted TOTP secret

  @Prop({ type: [String], default: [] })
  backupCodes: string[]; // Hashed backup codes

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  lastTwoFactorAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance and data integrity
UserSchema.index({ email: 1 }, { unique: true }); // Ensure email uniqueness
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ companyName: 1 });
UserSchema.index({ tenantId: 1 });
UserSchema.index({ tenantId: 1, role: 1 }); // Compound index for tenant + role queries
UserSchema.index({ createdAt: 1 }); // For auditing and monitoring
UserSchema.index({ lastLoginAt: 1 }); // For user activity tracking
