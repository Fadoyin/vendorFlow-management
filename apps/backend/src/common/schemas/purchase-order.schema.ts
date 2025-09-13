import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument, BaseSchema } from './base.schema';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT_TO_VENDOR = 'sent_to_vendor',
  PARTIALLY_RECEIVED = 'partially_received',
  FULLY_RECEIVED = 'fully_received',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum PurchaseOrderType {
  REGULAR = 'regular',
  BLANKET = 'blanket',
  CONTRACT = 'contract',
  EMERGENCY = 'emergency',
  REPLENISHMENT = 'replenishment',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NOT_REQUIRED = 'not_required',
}

@Schema({ timestamps: true })
export class PurchaseOrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  itemName: string;

  @Prop({ required: true, trim: true })
  itemSku: string;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({
    type: String,
    enum: ['piece', 'kg', 'l', 'm', 'box', 'pack'],
    required: true,
  })
  unitOfMeasure: string;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: String, required: true, trim: true })
  currency: string;

  @Prop({ type: Number, min: 0 })
  discountRate: number;

  @Prop({ type: Number, min: 0 })
  taxRate: number;

  @Prop({ type: Number, min: 0 })
  totalAmount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  receivedQuantity: number;

  @Prop({ type: Number, min: 0, default: 0 })
  remainingQuantity: number;

  @Prop({ type: Date })
  expectedDeliveryDate: Date;

  @Prop({ type: String, trim: true })
  notes: string;

  @Prop({ type: Object })
  customFields: Record<string, any>;
}

@Schema({ timestamps: true })
export class PurchaseOrderApproval {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  approverId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  approverName: string;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Prop({ type: String, trim: true })
  comments: string;

  @Prop({ type: Date })
  approvedAt: Date;

  @Prop({ type: Date })
  rejectedAt: Date;

  @Prop({ type: Number, min: 1 })
  approvalLevel: number;

  @Prop({ type: Boolean, default: false })
  isRequired: boolean;
}

@Schema({ timestamps: true })
export class PurchaseOrderReceipt {
  @Prop({ type: Date, required: true })
  receiptDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receivedBy: Types.ObjectId;

  @Prop({ required: true, trim: true })
  receivedByName: string;

  @Prop({ type: String, trim: true })
  receiptNumber: string;

  @Prop({ type: String, trim: true })
  deliveryNote: string;

  @Prop({ type: String, trim: true })
  carrier: string;

  @Prop({ type: String, trim: true })
  trackingNumber: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: String, trim: true })
  notes: string;

  @Prop({ type: Object })
  customFields: Record<string, any>;
}

@Schema({ timestamps: true })
export class PurchaseOrder extends BaseDocument {
  @Prop({ required: true, unique: true, trim: true })
  poNumber: string;

  @Prop({
    type: String,
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Prop({
    type: String,
    enum: PurchaseOrderType,
    default: PurchaseOrderType.REGULAR,
  })
  type: PurchaseOrderType;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  vendorName: string;

  @Prop({ type: String, trim: true })
  vendorCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requesterId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  requesterName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  buyerId: Types.ObjectId;

  @Prop({ type: String, trim: true })
  buyerName: string;

  @Prop({ type: Date, required: true })
  orderDate: Date;

  @Prop({ type: Date, required: true })
  expectedDeliveryDate: Date;

  @Prop({ type: Date })
  actualDeliveryDate: Date;

  @Prop({ type: [PurchaseOrderItem], required: true })
  items: PurchaseOrderItem[];

  @Prop({ type: Number, min: 0, default: 0 })
  subtotal: number;

  @Prop({ type: Number, min: 0, default: 0 })
  totalDiscount: number;

  @Prop({ type: Number, min: 0, default: 0 })
  totalTax: number;

  @Prop({ type: Number, min: 0, default: 0 })
  shippingCost: number;

  @Prop({ type: Number, min: 0, default: 0 })
  totalAmount: number;

  @Prop({ type: String, required: true, trim: true })
  currency: string;

  @Prop({ type: String, trim: true })
  paymentTerms: string;

  @Prop({ type: Date })
  paymentDueDate: Date;

  @Prop({ type: [PurchaseOrderApproval], default: [] })
  approvals: PurchaseOrderApproval[];

  @Prop({ type: [PurchaseOrderReceipt], default: [] })
  receipts: PurchaseOrderReceipt[];

  @Prop({ type: String, trim: true })
  shippingAddress: string;

  @Prop({ type: String, trim: true })
  billingAddress: string;

  @Prop({ type: String, trim: true })
  specialInstructions: string;

  @Prop({ type: String, trim: true })
  notes: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  customFields: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isUrgent: boolean;

  @Prop({ type: String, trim: true })
  rejectionReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy: Types.ObjectId;

  @Prop({ type: Date })
  rejectedAt: Date;

  @Prop({ type: Date })
  sentToVendorAt: Date;

  @Prop({ type: Date })
  closedAt: Date;
}

export const PurchaseOrderSchema = SchemaFactory.createForClass(PurchaseOrder);

// Add base schema fields
PurchaseOrderSchema.add(BaseSchema);

// Indexes
PurchaseOrderSchema.index({ poNumber: 1 });
PurchaseOrderSchema.index({ tenantId: 1, poNumber: 1 });
PurchaseOrderSchema.index({ tenantId: 1, status: 1 });
PurchaseOrderSchema.index({ tenantId: 1, vendorId: 1 });
PurchaseOrderSchema.index({ tenantId: 1, requesterId: 1 });
PurchaseOrderSchema.index({ tenantId: 1, orderDate: -1 });
PurchaseOrderSchema.index({ tenantId: 1, expectedDeliveryDate: 1 });
PurchaseOrderSchema.index({ 'items.itemId': 1 });

// Virtual for total items
PurchaseOrderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for received items
PurchaseOrderSchema.virtual('totalReceivedItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
});

// Virtual for completion percentage
PurchaseOrderSchema.virtual('completionPercentage').get(function () {
  if (this.items.length === 0) return 0;
  const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceivedItems = this.items.reduce(
    (sum, item) => sum + (item.receivedQuantity || 0),
    0,
  );
  return Math.round((totalReceivedItems / totalItems) * 100);
});

// Ensure virtual fields are serialized
PurchaseOrderSchema.set('toJSON', { virtuals: true });
PurchaseOrderSchema.set('toObject', { virtuals: true });
