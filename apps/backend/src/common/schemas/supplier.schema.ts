import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum SupplierCategory {
  FOOD_SUPPLIES = 'food_supplies',
  BEVERAGES = 'beverages',
  DAIRY = 'dairy',
  MEAT = 'meat',
  PRODUCE = 'produce',
  PACKAGING = 'packaging',
  EQUIPMENT = 'equipment',
  LOGISTICS = 'logistics',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, type: Types.ObjectId })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  supplierName: string;

  @Prop({ required: true, unique: true })
  supplierCode: string;

  @Prop({ required: true, enum: SupplierCategory })
  category: SupplierCategory;

  @Prop({
    required: true,
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE,
  })
  status: SupplierStatus;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  zipCode: string;

  @Prop()
  country: string;

  @Prop()
  contactPerson?: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  taxId?: string;

  @Prop()
  businessLicense?: string;

  @Prop()
  insuranceInfo?: string;

  @Prop()
  paymentTerms?: string;

  @Prop()
  creditLimit?: number;

  @Prop()
  rating?: number;

  @Prop()
  totalOrders?: number;

  @Prop()
  totalSpent?: number;

  @Prop()
  lastOrderDate?: Date;

  @Prop()
  logo?: string;

  @Prop({ type: [String] })
  documents?: string[];

  @Prop({ type: [Types.ObjectId], ref: 'Vendor' })
  vendors: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Inventory' })
  inventory: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Order' })
  orders: Types.ObjectId[];

  @Prop()
  leadTime?: number; // in days

  @Prop()
  minimumOrder?: number;

  @Prop()
  deliveryArea?: string;

  @Prop()
  certifications?: string[];

  @Prop()
  qualityRating?: number;

  @Prop()
  reliabilityScore?: number;

  @Prop()
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

// Indexes for better query performance
SupplierSchema.index({ supplierName: 1 });
SupplierSchema.index({ supplierCode: 1 });
SupplierSchema.index({ category: 1 });
SupplierSchema.index({ status: 1 });
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ rating: 1 });
SupplierSchema.index({ city: 1, state: 1 });
SupplierSchema.index({ email: 1 });
SupplierSchema.index({ totalOrders: -1 });
SupplierSchema.index({ totalSpent: -1 });
