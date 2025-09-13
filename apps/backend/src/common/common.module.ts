import { Module } from '@nestjs/common';
import { RBACService } from './services/rbac.service';

@Module({
  providers: [RBACService],
  exports: [RBACService],
})
export class CommonModule {} 