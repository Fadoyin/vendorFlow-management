import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import {
  NotificationType,
  NotificationStatus,
} from './schemas/notification.schema';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Get all notifications with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Filter by vendor ID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: NotificationType,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: NotificationStatus,
    description: 'Filter by notification status',
  })
  findAll(
    @Request() req: any,
    @Query('vendorId') vendorId?: string,
    @Query('type') type?: NotificationType,
    @Query('status') status?: NotificationStatus,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      vendorId,
      type,
      status,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  getStats(@Request() req: any) {
    return this.notificationsService.getNotificationStats(req.user.id);
  }

  @Get('unread')
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Unread notifications retrieved successfully',
  })
  getUnreadNotifications(@Request() req: any) {
    return this.notificationsService.findAll(
      req.user.id,
      undefined,
      undefined,
      NotificationStatus.DELIVERED,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read')
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
  })
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN,  UserRole.VENDOR)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  // Admin endpoints for sending notifications
  @Post('send-order-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send order status notification' })
  @ApiResponse({
    status: 201,
    description: 'Order status notification sent successfully',
  })
  sendOrderStatusNotification(
    @Body()
    data: {
      userId: string;
      orderId: string;
      status: string;
      vendorId?: string;
    },
  ) {
    return this.notificationsService.sendOrderStatusNotification(
      data.userId,
      data.orderId,
      data.status,
      data.vendorId,
    );
  }

  @Post('send-payment')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send payment notification' })
  @ApiResponse({
    status: 201,
    description: 'Payment notification sent successfully',
  })
  sendPaymentNotification(
    @Body()
    data: {
      userId: string;
      paymentId: string;
      amount: number;
      status: string;
      vendorId?: string;
    },
  ) {
    return this.notificationsService.sendPaymentNotification(
      data.userId,
      data.paymentId,
      data.amount,
      data.status,
      data.vendorId,
    );
  }

  @Post('send-forecast')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send forecast notification' })
  @ApiResponse({
    status: 201,
    description: 'Forecast notification sent successfully',
  })
  sendForecastNotification(
    @Body()
    data: {
      userId: string;
      forecastId: string;
      type: string;
      vendorId?: string;
    },
  ) {
    return this.notificationsService.sendForecastNotification(
      data.userId,
      data.forecastId,
      data.type,
      data.vendorId,
    );
  }
}
