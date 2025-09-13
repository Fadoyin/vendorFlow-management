import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Order, OrderSchema } from '../../common/schemas/order.schema';
import { Vendor, VendorSchema } from '../../common/schemas/vendor.schema';
import { Item, ItemSchema } from '../../common/schemas/item.schema';
import { PaymentTransaction, PaymentTransactionSchema } from '../payments/schemas/payment-transaction.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AwsModule } from '../../common/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Item.name, schema: ItemSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
    AwsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
