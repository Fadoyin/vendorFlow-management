import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument, BaseSchema } from './base.schema';

export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  SUPPLIER = 'supplier',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

@Schema({ timestamps: true })
export class User extends BaseDocument {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.VENDOR })
  role: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Prop({ type: String, trim: true })
  avatar: string;

  @Prop({ type: String, trim: true })
  jobTitle: string;

  @Prop({ type: String, trim: true })
  department: string;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({ type: String, trim: true })
  cognitoSub: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Object })
  preferences: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  @Prop({ type: Date })
  emailVerifiedAt: Date;

  @Prop({ type: String, trim: true })
  resetPasswordToken: string;

  @Prop({ type: Date })
  resetPasswordExpires: Date;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  managedUsers: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add base schema fields
UserSchema.add(BaseSchema);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ tenantId: 1, email: 1 });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ tenantId: 1, status: 1 });
UserSchema.index({ cognitoSub: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
