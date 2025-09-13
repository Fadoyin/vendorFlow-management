import { Module } from '@nestjs/common';
import { ActivityLogsController } from './activity-logs.controller';

@Module({
  controllers: [ActivityLogsController],
  providers: [],
  exports: [],
})
export class ActivityLogsModule {} 