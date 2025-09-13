import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeModule } from '../../common/stripe/stripe.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './schemas/payment-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    StripeModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
