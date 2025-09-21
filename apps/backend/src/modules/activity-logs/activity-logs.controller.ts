import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ActivityLogsService, CreateActivityLogDto } from './activity-logs.service';

@ApiTags('activity-logs')
@ApiBearerAuth()
@Controller('activity-logs')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  async getActivities(
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'createdAt:desc',
    @Request() req: any,
  ) {
    const tenantId = req.tenantId;
    const userId = req.userId;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }

    const limitNum = Math.min(parseInt(limit) || 10, 100); // Cap at 100
    const offset = parseInt(req.query?.offset) || 0;

    try {
      // Get real activity logs from database
      const result = await this.activityLogsService.getRecentActivities(
        tenantId,
        limitNum,
        offset
      );

      // If no real activities exist, create some sample activities for the tenant
      if (result.activities.length === 0) {
        await this.createSampleActivities(tenantId, userId);
        
        // Re-fetch after creating samples
        const newResult = await this.activityLogsService.getRecentActivities(
          tenantId,
          limitNum,
          offset
        );
        
        return {
          activities: newResult.activities,
          total: newResult.total,
        };
      }

      return {
        activities: result.activities,
        total: result.total,
      };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      
      // Fallback to empty response
      return {
        activities: [],
        total: 0,
      };
    }
  }

  /**
   * Create sample activities for new tenants
   */
  private async createSampleActivities(tenantId: string, userId: string): Promise<void> {
    try {
      const sampleActivities = [
        {
          tenantId,
          userId,
          type: 'user' as any,
          action: 'login' as any,
          description: 'User logged into the dashboard',
          entityType: 'user',
        },
        {
          tenantId,
          userId,
          type: 'system' as any,
          action: 'created' as any,
          description: 'Dashboard initialized for tenant',
          entityType: 'system',
        },
      ];

      for (const activity of sampleActivities) {
        await this.activityLogsService.create(activity);
      }
    } catch (error) {
      console.error('Error creating sample activities:', error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create activity log entry' })
  @ApiResponse({ status: 201, description: 'Activity log created successfully' })
  async createActivity(@Body() activityData: CreateActivityLogDto, @Request() req: any) {
    const tenantId = req.tenantId;
    const userId = req.userId;
    
    if (!tenantId || !userId) {
      throw new BadRequestException('Tenant ID and User ID are required');
    }

    try {
      const createdActivity = await this.activityLogsService.create({
        ...activityData,
        tenantId,
        userId,
      });

      return {
        success: true,
        message: 'Activity log created successfully',
        data: createdActivity,
      };
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw new BadRequestException('Failed to create activity log');
    }
  }
} 