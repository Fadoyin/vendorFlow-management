import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import {
  PurchaseOrder,
  PurchaseOrderSchema,
} from './schemas/purchase-order.schema';
import { Vendor, VendorSchema } from '../../common/schemas/vendor.schema';
import { Item, ItemSchema } from '../../common/schemas/item.schema';
import { User, UserSchema } from '../../common/schemas/user.schema';
import { AwsModule } from '../../common/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseOrder.name, schema: PurchaseOrderSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Item.name, schema: ItemSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AwsModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
