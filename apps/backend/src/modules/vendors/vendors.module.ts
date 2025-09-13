import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { Vendor, VendorSchema } from '../../common/schemas/vendor.schema';
import { Order, OrderSchema } from '../../common/schemas/order.schema';
import { Item, ItemSchema } from '../../common/schemas/item.schema';
import { AwsModule } from '../../common/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vendor.name, schema: VendorSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
    AwsModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
