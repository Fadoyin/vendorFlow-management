import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDocument } from './base.schema';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed'
}

export enum ContractType {
  SUPPLY_AGREEMENT = 'supply_agreement',
  SERVICE_CONTRACT = 'service_contract',
  MASTER_AGREEMENT = 'master_agreement',
  PURCHASE_CONTRACT = 'purchase_contract'
}

@Schema({ timestamps: true })
export class ContractTerm {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  unit?: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class ContractMilestone {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop()
  completedDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true })
export class Contract extends BaseDocument {
  @Prop({ required: true, unique: true })
  contractNumber: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: String, enum: ContractType })
  contractType: ContractType;

  @Prop({ required: true, type: String, enum: ContractStatus, default: ContractStatus.DRAFT })
  status: ContractStatus;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Vendor' })
  vendorId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, min: 0 })
  contractValue: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop()
  description?: string;

  @Prop({ type: [ContractTerm], default: [] })
  terms: ContractTerm[];

  @Prop({ type: [ContractMilestone], default: [] })
  milestones: ContractMilestone[];

  @Prop()
  paymentTerms?: string;

  @Prop()
  deliveryTerms?: string;

  @Prop()
  penaltyClause?: string;

  @Prop()
  terminationClause?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  signedBy?: Types.ObjectId;

  @Prop()
  signedAt?: Date;

  @Prop()
  renewalDate?: Date;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop()
  renewalTerms?: string;

  @Prop()
  notes?: string;

  @Prop({ type: Object })
  customFields?: Record<string, any>;

  @Prop({ type: [{ 
    status: { type: String, enum: ContractStatus },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Types.ObjectId, ref: 'User' },
    notes: String
  }], default: [] })
  statusHistory: Array<{
    status: ContractStatus;
    timestamp: Date;
    updatedBy: Types.ObjectId;
    notes?: string;
  }>;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Add indexes for better query performance
ContractSchema.index({ tenantId: 1, vendorId: 1 });
ContractSchema.index({ tenantId: 1, status: 1 });
ContractSchema.index({ tenantId: 1, contractNumber: 1 });
ContractSchema.index({ tenantId: 1, endDate: 1 }); 