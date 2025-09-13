import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';
import { Forecast, ForecastSchema } from '../../common/schemas/forecast.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Forecast.name, schema: ForecastSchema },
    ]),
  ],
  controllers: [ForecastsController],
  providers: [ForecastsService],
  exports: [ForecastsService],
})
export class ForecastsModule {}
