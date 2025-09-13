import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument, BaseSchema } from './base.schema';

export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLACKLISTED = 'blacklisted',
}

export enum VendorCategory {
  RAW_MATERIALS = 'raw_materials',
  PACKAGING = 'packaging',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  LOGISTICS = 'logistics',
  OTHER = 'other',
}

export enum PaymentTerms {
  NET_30 = 'net_30',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  IMMEDIATE = 'immediate',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true })
export class VendorAddress {
  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  zipCode: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ trim: true })
  additionalInfo: string;
}

@Schema({ timestamps: true })
export class VendorContact {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  jobTitle: string;

  @Prop({ type: Boolean, default: false })
  isPrimary: boolean;
}

@Schema({ timestamps: true })
export class VendorDocument {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  type: string;

  @Prop({ required: true, trim: true })
  s3Key: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: Date })
  expiryDate: Date;

  @Prop({ type: Boolean, default: false })
  isExpired: boolean;
}

@Schema({ timestamps: true })
export class VendorPerformance {
  @Prop({ type: Number, default: 0 })
  onTimeDeliveryRate: number;

  @Prop({ type: Number, default: 0 })
  qualityScore: number;

  @Prop({ type: Number, default: 0 })
  costCompetitiveness: number;

  @Prop({ type: Number, default: 0 })
  communicationScore: number;

  @Prop({ type: Number, default: 0 })
  overallScore: number;

  @Prop({ type: Number, default: 0 })
  totalOrders: number;

  @Prop({ type: Number, default: 0 })
  totalSpend: number;

  @Prop({ type: Date })
  lastOrderDate: Date;

  @Prop({ type: Date })
  lastPerformanceReview: Date;
}

@Schema({ timestamps: true })
export class Vendor extends BaseDocument {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  vendorCode: string;

  @Prop({ type: String, enum: VendorStatus, default: VendorStatus.ACTIVE })
  status: VendorStatus;

  @Prop({ type: String, enum: VendorCategory, required: true })
  category: VendorCategory;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: String, trim: true })
  website: string;

  @Prop({ type: String, trim: true })
  logo: string;

  @Prop({ type: VendorAddress, required: true })
  address: VendorAddress;

  @Prop({ type: [VendorContact], required: true })
  contacts: VendorContact[];

  @Prop({ type: String, enum: PaymentTerms, default: PaymentTerms.NET_30 })
  paymentTerms: PaymentTerms;

  @Prop({ type: Number, default: 0 })
  creditLimit: number;

  @Prop({ type: Number, default: 0 })
  currentBalance: number;

  @Prop({ type: String, trim: true })
  taxId: string;

  @Prop({ type: String, trim: true })
  registrationNumber: string;

  @Prop({ type: Date })
  establishedDate: Date;

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ type: [String], default: [] })
  capabilities: string[];

  @Prop({ type: [VendorDocument], default: [] })
  documents: VendorDocument[];

  @Prop({ type: VendorPerformance, default: {} })
  performance: VendorPerformance;

  @Prop({ type: [Types.ObjectId], ref: 'Item', default: [] })
  items: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'PurchaseOrder', default: [] })
  purchaseOrders: Types.ObjectId[];

  @Prop({ type: Object })
  customFields: Record<string, any>;

  @Prop({ type: String, trim: true })
  notes: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

// Add base schema fields
VendorSchema.add(BaseSchema);

// Indexes
VendorSchema.index({ vendorCode: 1 });
VendorSchema.index({ tenantId: 1, vendorCode: 1 });
VendorSchema.index({ tenantId: 1, status: 1 });
VendorSchema.index({ tenantId: 1, category: 1 });
VendorSchema.index({ tenantId: 1, 'performance.overallScore': -1 });
VendorSchema.index({ 'performance.lastOrderDate': -1 });

// Virtual for full address
VendorSchema.virtual('fullAddress').get(function () {
  const addr = this.address;
  if (!addr) return '';

  const parts = [];
  if (addr.street) parts.push(addr.street);
  if (addr.city) parts.push(addr.city);
  if (addr.state && addr.zipCode) parts.push(`${addr.state} ${addr.zipCode}`);
  else if (addr.state) parts.push(addr.state);
  else if (addr.zipCode) parts.push(addr.zipCode);
  if (addr.country) parts.push(addr.country);

  return parts.join(', ');
});

// Ensure virtual fields are serialized
VendorSchema.set('toJSON', { virtuals: true });
VendorSchema.set('toObject', { virtuals: true });
