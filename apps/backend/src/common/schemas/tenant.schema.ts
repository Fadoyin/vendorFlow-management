import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export enum TenantPlan {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  subdomain: string;

  @Prop({ required: true, unique: true, trim: true })
  domain: string;

  @Prop({ type: String, enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Prop({ type: String, enum: TenantPlan, default: TenantPlan.BASIC })
  plan: TenantPlan;

  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: String, trim: true })
  logo: string;

  @Prop({ type: String, trim: true })
  primaryColor: string;

  @Prop({ type: String, trim: true })
  secondaryColor: string;

  @Prop({
    type: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true },
      },
    },
    required: true,
  })
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };

  @Prop({ type: Date })
  trialEndsAt: Date;

  @Prop({ type: Date })
  subscriptionEndsAt: Date;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: Number, default: 0 })
  maxUsers: number;

  @Prop({ type: Number, default: 0 })
  maxVendors: number;

  @Prop({ type: Number, default: 0 })
  maxItems: number;

  @Prop({ type: Object })
  settings: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// Indexes
TenantSchema.index({ subdomain: 1 });
TenantSchema.index({ domain: 1 });
TenantSchema.index({ status: 1 });
TenantSchema.index({ createdAt: 1 });
