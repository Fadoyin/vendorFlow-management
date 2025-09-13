import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Import all schemas
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { Vendor, VendorSchema } from '../schemas/vendor.schema';
import { Item, ItemSchema } from '../schemas/item.schema';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from '../schemas/purchase-order.schema';
import { Forecast, ForecastSchema } from '../schemas/forecast.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Item.name, schema: ItemSchema },
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Forecast.name, schema: ForecastSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
