import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Inject } from '@nestjs/common';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private configService: ConfigService,
    @InjectConnection() private readonly connection: Connection,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  async isHealthy(key: string): Promise<any> {
    try {
      switch (key) {
        case 'database':
          return this.checkDatabase();
        case 'redis':
          return this.checkRedis();
        case 'aws':
          return this.checkAws();
        case 'ml-service':
          return this.checkMlService();
        default:
          return { [key]: { status: 'unknown' } };
      }
    } catch (error) {
      this.logger.error(`Health check failed for ${key}: ${error.message}`);
      return { [key]: { status: 'down', error: error.message } };
    }
  }

  private async checkDatabase(): Promise<any> {
    try {
      const isConnected = this.connection.readyState === 1;
      if (isConnected) {
        return { database: { status: 'up' } };
      } else {
        return {
          database: { status: 'down', error: 'Database not connected' },
        };
      }
    } catch (error) {
      return { database: { status: 'down', error: error.message } };
    }
  }

  private async checkRedis(): Promise<any> {
    try {
      const isConnected = this.redisClient.status === 'ready';
      if (isConnected) {
        await this.redisClient.ping();
        return { redis: { status: 'up' } };
      } else {
        return { redis: { status: 'down', error: 'Redis not connected' } };
      }
    } catch (error) {
      return { redis: { status: 'down', error: error.message } };
    }
  }

  private async checkAws(): Promise<any> {
    try {
      // Basic AWS configuration check
      const region = this.configService.get<string>('AWS_REGION');
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );

      if (region && accessKeyId && secretAccessKey) {
        return { aws: { status: 'up' } };
      } else {
        return {
          aws: { status: 'down', error: 'AWS credentials not configured' },
        };
      }
    } catch (error) {
      return { aws: { status: 'down', error: error.message } };
    }
  }

  private async checkMlService(): Promise<any> {
    try {
      const mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL');
      if (!mlServiceUrl) {
        return {
          'ml-service': {
            status: 'down',
            error: 'ML service URL not configured',
          },
        };
      }

      // Try to ping ML service
      const response = await fetch(`${mlServiceUrl}/health`);
      if (response.ok) {
        return { 'ml-service': { status: 'up' } };
      } else {
        return {
          'ml-service': { status: 'down', error: `HTTP ${response.status}` },
        };
      }
    } catch (error) {
      return { 'ml-service': { status: 'down', error: error.message } };
    }
  }

  async isReady(): Promise<{ status: string; timestamp: string }> {
    try {
      // Check if all critical services are ready
      const dbCheck = await this.checkDatabase();
      const redisCheck = await this.checkRedis();

      const isReady =
        dbCheck.database?.status === 'up' && redisCheck.redis?.status === 'up';

      return {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Readiness check failed: ${error.message}`);
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async isLive(): Promise<{ status: string; timestamp: string }> {
    // Liveness check - service is alive if it can respond
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  async getSystemInfo(): Promise<any> {
    return {
      service: 'vendor-management-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      config: {
        port: this.configService.get<number>('PORT', 3001),
        database: this.configService.get<string>('MONGODB_URI')
          ? 'configured'
          : 'not_configured',
        redis: this.configService.get<string>('REDIS_URL')
          ? 'configured'
          : 'not_configured',
        aws: this.configService.get<string>('AWS_REGION')
          ? 'configured'
          : 'not_configured',
        mlService: this.configService.get<string>('ML_SERVICE_URL')
          ? 'configured'
          : 'not_configured',
      },
    };
  }
}
