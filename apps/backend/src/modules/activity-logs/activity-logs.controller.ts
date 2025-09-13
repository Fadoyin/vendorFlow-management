import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('activity-logs')
@ApiBearerAuth()
@Controller('activity-logs')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ActivityLogsController {
  constructor() {}

  @Get()
  @ApiOperation({ summary: 'Get recent activity logs' })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  getActivities(
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'createdAt:desc',
    @Request() req: any,
  ) {
    // Mock activity data for now
    const mockActivities = [
      {
        id: '1',
        type: 'order',
        action: 'created',
        description: 'New order #ORD-2024-0001 created',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        userId: req.userId,
        entityId: 'ORD-2024-0001',
        entityType: 'order',
      },
      {
        id: '2',
        type: 'inventory',
        action: 'updated',
        description: 'Inventory updated for Premium Coffee Beans',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        userId: req.userId,
        entityId: '1',
        entityType: 'inventory',
      },
      {
        id: '3',
        type: 'vendor',
        action: 'created',
        description: 'New vendor "Tech Supplies Co" added',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        userId: req.userId,
        entityId: 'vendor-123',
        entityType: 'vendor',
      },
      {
        id: '4',
        type: 'payment',
        action: 'processed',
        description: 'Payment of $1,250 processed successfully',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        userId: req.userId,
        entityId: 'payment-456',
        entityType: 'payment',
      },
      {
        id: '5',
        type: 'inventory',
        action: 'low_stock',
        description: 'Low stock alert for Organic Tea Leaves (5 remaining)',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        userId: req.userId,
        entityId: '2',
        entityType: 'inventory',
      },
    ];

    const limitNum = parseInt(limit) || 10;
    return {
      activities: mockActivities.slice(0, limitNum),
      total: mockActivities.length,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create activity log entry' })
  @ApiResponse({ status: 201, description: 'Activity log created successfully' })
  createActivity(@Body() activityData: any, @Request() req: any) {
    // Mock creation - in real implementation, this would save to database
    console.log('Creating activity log:', {
      ...activityData,
      userId: req.userId,
      tenantId: req.tenantId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Activity log created successfully',
    };
  }
} 