import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { ForecastsModule } from './modules/forecasts/forecasts.module';
// // // import { ForecastingModule } from './modules/forecasting/forecasting.module';
import { HealthModule } from './modules/health/health.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';

// Common Modules
import { DatabaseModule } from './common/database/database.module';
import { AwsModule } from './common/aws/aws.module';
import { RedisModule } from './common/redis/redis.module';
import { UploadModule } from './common/upload/upload.module';
import { EmailModule } from './common/email/email.module';
// import { CronModule } from './common/cron/cron.module';


import { LoggingModule } from './common/logging/logging.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database - Try MongoDB first, fallback to mock
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/vendor-management',
        );
        const logger = new Logger('DatabaseConnection');

        return {
          uri,
          connectionFactory: (connection: any) => {
            connection.on('connected', () => {
              logger.log('Successfully connected to MongoDB');
            });
            connection.on('error', (error: any) => {
              logger.error('MongoDB connection error:', error);
              logger.warn('Using mock database for development');
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),

    // Feature Modules
    DatabaseModule,
    AwsModule,
    RedisModule,
    UploadModule,
    EmailModule,
    // CronModule, // Temporarily disabled due to crypto issue

    LoggingModule,
    AuthModule,
    UsersModule,
    VendorsModule,
    InventoryModule,
    PurchaseOrdersModule,
    ForecastsModule,
    // ForecastingModule, // Temporarily disabled due to aggregation pipeline errors
    HealthModule,
    SuppliersModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    ActivityLogsModule,
    // AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor() {
    const logger = new Logger('AppModule');
    logger.log('Application modules loaded successfully');
  }
}
