import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDocument } from '../../../common/schemas/base.schema';

export type PurchaseOrderDocument = PurchaseOrder & Document;

@Schema({ timestamps: true })
export class PurchaseOrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ min: 0, default: 0 })
  discountPercentage?: number;

  @Prop({ min: 0, default: 0 })
  taxPercentage?: number;

  @Prop({ min: 0, default: 0 })
  receivedQuantity?: number;

  @Prop()
  receivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  receivedBy?: Types.ObjectId;

  @Prop()
  expectedDeliveryDate?: Date;

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true })
export class PurchaseOrderApproval {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  approvedBy: Types.ObjectId;

  @Prop({ required: true, enum: ['Pending', 'Approved', 'Rejected'] })
  status: string;

  @Prop()
  requestedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  requestedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  comments?: string;
}

@Schema({ timestamps: true })
export class PurchaseOrder extends BaseDocument {
  @Prop({ required: true, unique: true })
  poNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [PurchaseOrderItem], required: true })
  items: PurchaseOrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: [PurchaseOrderApproval] })
  approvals: PurchaseOrderApproval[];

  @Prop({
    required: true,
    enum: [
      'Draft',
      'Submitted',
      'Approved',
      'Rejected',
      'Sent to Vendor',
      'Partially Received',
      'Fully Received',
      'Closed',
      'Cancelled',
    ],
  })
  status: string;

  @Prop()
  orderDate?: Date;

  @Prop()
  expectedDeliveryDate?: Date;

  @Prop()
  paymentTerms?: string;

  @Prop()
  paymentDueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  submittedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  submittedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop()
  sentToVendorAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sentBy?: Types.ObjectId;

  @Prop()
  completedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancellationReason?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

// Indexes
PurchaseOrderSchema.index({ tenantId: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ tenantId: 1, status: 1 });
PurchaseOrderSchema.index({ tenantId: 1, vendorId: 1 });
PurchaseOrderSchema.index({ tenantId: 1, createdBy: 1 });
PurchaseOrderSchema.index({ tenantId: 1, createdAt: -1 });
