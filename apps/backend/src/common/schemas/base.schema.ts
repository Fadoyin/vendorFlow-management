import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BaseDocument extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Tenant' })
  tenantId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;
}

export const BaseSchema = SchemaFactory.createForClass(BaseDocument);
