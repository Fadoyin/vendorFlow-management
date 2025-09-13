import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Item, ItemSchema } from '../../common/schemas/item.schema';
import { AwsModule } from '../../common/aws/aws.module';
import { RBACService } from '../../common/services/rbac.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }]),
    AwsModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, RBACService],
  exports: [InventoryService],
})
export class InventoryModule {}
