import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseDocument, BaseSchema } from './base.schema';

export enum ItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum ItemCategory {
  RAW_MATERIALS = 'raw_materials',
  FINISHED_GOODS = 'finished_goods',
  WORK_IN_PROGRESS = 'work_in_progress',
  PACKAGING = 'packaging',
  SUPPLIES = 'supplies',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

export enum UnitOfMeasure {
  PIECE = 'piece',
  KILOGRAM = 'kg',
  GRAM = 'g',
  LITER = 'l',
  MILLILITER = 'ml',
  METER = 'm',
  CENTIMETER = 'cm',
  SQUARE_METER = 'sqm',
  CUBIC_METER = 'cbm',
  BOX = 'box',
  PACK = 'pack',
  ROLL = 'roll',
  SET = 'set',
  PAIR = 'pair',
  DOZEN = 'dozen',
  HUNDRED = 'hundred',
  THOUSAND = 'thousand',
}

@Schema({ timestamps: true })
export class ItemDimensions {
  @Prop({ type: Number })
  length: number;

  @Prop({ type: Number })
  width: number;

  @Prop({ type: Number })
  height: number;

  @Prop({
    type: String,
    enum: UnitOfMeasure,
    default: UnitOfMeasure.CENTIMETER,
  })
  dimensionUnit: UnitOfMeasure;

  @Prop({ type: Number })
  weight: number;

  @Prop({ type: String, enum: UnitOfMeasure, default: UnitOfMeasure.KILOGRAM })
  weightUnit: UnitOfMeasure;
}

@Schema({ timestamps: true })
export class ItemPricing {
  @Prop({ type: Number, required: true, min: 0 })
  costPrice: number;

  @Prop({ type: Number, min: 0 })
  sellingPrice: number;

  @Prop({ type: Number, min: 0 })
  wholesalePrice: number;

  @Prop({ type: String, required: true, trim: true })
  currency: string;

  @Prop({ type: Number, min: 0 })
  taxRate: number;

  @Prop({ type: Number, min: 0 })
  discountRate: number;

  @Prop({ type: Date })
  lastPriceUpdate: Date;
}

@Schema({ timestamps: true })
export class ItemInventory {
  @Prop({ type: Number, default: 0, min: 0 })
  currentStock: number;

  @Prop({ type: Number, default: 0, min: 0 })
  reservedStock: number;

  @Prop({ type: Number, default: 0, min: 0 })
  availableStock: number;

  @Prop({ type: Number, required: true, min: 0 })
  reorderPoint: number;

  @Prop({ type: Number, required: true, min: 0 })
  reorderQuantity: number;

  @Prop({ type: Number, default: 0, min: 0 })
  maxStock: number;

  @Prop({ type: Number, default: 0, min: 0 })
  minStock: number;

  @Prop({ type: String, enum: UnitOfMeasure, required: true })
  stockUnit: UnitOfMeasure;

  @Prop({ type: [String], default: [] })
  storageLocations: string[];

  @Prop({ type: String, trim: true })
  primaryLocation: string;

  @Prop({ type: Date })
  lastStockCount: Date;

  @Prop({ type: Date })
  lastStockMovement: Date;
}

@Schema({ timestamps: true })
export class ItemSupplier {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true })
  vendorId: Types.ObjectId;

  @Prop({ type: String, trim: true })
  vendorItemCode: string;

  @Prop({ type: Number, min: 0 })
  leadTime: number;

  @Prop({ type: String, trim: true })
  leadTimeUnit: string;

  @Prop({ type: Number, min: 0 })
  minimumOrderQuantity: number;

  @Prop({ type: Number, min: 0 })
  unitCost: number;

  @Prop({ type: String, trim: true })
  currency: string;

  @Prop({ type: Boolean, default: false })
  isPreferred: boolean;

  @Prop({ type: Date })
  lastOrderDate: Date;

  @Prop({ type: Number, min: 0 })
  lastOrderQuantity: number;
}

@Schema({ timestamps: true })
export class Item extends BaseDocument {
  @Prop({ required: true, unique: true, trim: true })
  sku: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: String, enum: ItemStatus, default: ItemStatus.ACTIVE })
  status: ItemStatus;

  @Prop({ type: String, enum: ItemCategory, required: true })
  category: ItemCategory;

  @Prop({ type: String, enum: UnitOfMeasure, required: true })
  unitOfMeasure: UnitOfMeasure;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, trim: true })
  brand: string;

  @Prop({ type: String, trim: true })
  itemModel: string;

  @Prop({ type: String, trim: true })
  manufacturer: string;

  @Prop({ type: String, trim: true })
  countryOfOrigin: string;

  @Prop({ type: String, trim: true })
  barcode: string;

  @Prop({ type: String, trim: true })
  image: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: ItemDimensions })
  dimensions: ItemDimensions;

  @Prop({ type: ItemPricing, required: true })
  pricing: ItemPricing;

  @Prop({ type: ItemInventory, required: true })
  inventory: ItemInventory;

  @Prop({ type: [ItemSupplier], default: [] })
  suppliers: ItemSupplier[];

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  primarySupplier: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'PurchaseOrder', default: [] })
  purchaseOrders: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Forecast', default: [] })
  forecasts: Types.ObjectId[];

  @Prop({ type: Object })
  customFields: Record<string, any>;

  @Prop({ type: String, trim: true })
  notes: string;

  @Prop({ type: Boolean, default: false })
  isSerialized: boolean;

  @Prop({ type: Boolean, default: false })
  isLotTracked: boolean;

  @Prop({ type: Date })
  expiryDate: Date;

  @Prop({ type: Number, min: 0 })
  shelfLife: number;

  @Prop({ type: String, trim: true })
  shelfLifeUnit: string;
}

export const ItemSchema = SchemaFactory.createForClass(Item);

// Add base schema fields
ItemSchema.add(BaseSchema);

// Indexes
ItemSchema.index({ sku: 1 });
ItemSchema.index({ tenantId: 1, sku: 1 });
ItemSchema.index({ tenantId: 1, status: 1 });
ItemSchema.index({ tenantId: 1, category: 1 });
ItemSchema.index({ tenantId: 1, 'inventory.currentStock': 1 });
ItemSchema.index({ tenantId: 1, 'inventory.availableStock': 1 });
ItemSchema.index({ barcode: 1 });
ItemSchema.index({ 'inventory.primaryLocation': 1 });

// Virtual for stock status
ItemSchema.virtual('stockStatus').get(function () {
  const inv = this.inventory;
  if (inv.currentStock <= inv.minStock) return 'low';
  if (inv.currentStock >= inv.maxStock) return 'high';
  return 'normal';
});

// Virtual for total value
ItemSchema.virtual('totalValue').get(function () {
  return this.inventory.currentStock * this.pricing.costPrice;
});

// Ensure virtual fields are serialized
ItemSchema.set('toJSON', { virtuals: true });
ItemSchema.set('toObject', { virtuals: true });
