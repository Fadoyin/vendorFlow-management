import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private healthService: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check system health' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async check(): Promise<any> {
    const result = await this.health.check([
      () => this.healthService.isHealthy('database'),
      () => this.healthService.isHealthy('redis'),
      () => this.healthService.isHealthy('aws'),
      () => this.healthService.isHealthy('ml-service'),
    ]);
    return result;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if service is ready to receive traffic' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<{ status: string; timestamp: string }> {
    return this.healthService.isReady();
  }

  @Get('live')
  @ApiOperation({ summary: 'Check if service is alive' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  async live(): Promise<{ status: string; timestamp: string }> {
    return this.healthService.isLive();
  }

  @Get('info')
  @ApiOperation({ summary: 'Get system information' })
  @ApiResponse({ status: 200, description: 'System information' })
  async info(): Promise<any> {
    return this.healthService.getSystemInfo();
  }
}
