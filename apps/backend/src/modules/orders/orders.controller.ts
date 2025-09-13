import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.create(
      createOrderDto,
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(
    @Query() query: any,
    @Request() req: any,
  ) {
    const {
      page = 1,
      limit = 20,
      status,
      vendorId,
      supplierId,
      search,
      startDate,
      endDate,
    } = query;

    return this.ordersService.findAll(
      req.tenantId,
      req.userId,
      req.userRole,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        vendorId,
        supplierId,
        search,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  getStats(@Request() req: any) {
    return this.ordersService.getStats(
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get enhanced dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  getDashboardStats(@Request() req: any) {
    return this.ordersService.getDashboardStats(
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ summary: 'Get orders by vendor' })
  @ApiResponse({ status: 200, description: 'Vendor orders retrieved successfully' })
  findByVendor(
    @Param('vendorId') vendorId: string,
    @Query() query: any,
    @Request() req: any,
  ) {
    const { page = 1, limit = 20, status } = query;

    return this.ordersService.findByVendor(
      vendorId,
      req.tenantId,
      req.userId,
      req.userRole,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      },
    );
  }

  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Get orders by supplier' })
  @ApiResponse({ status: 200, description: 'Supplier orders retrieved successfully' })
  findBySupplier(
    @Param('supplierId') supplierId: string,
    @Query() query: any,
    @Request() req: any,
  ) {
    const { page = 1, limit = 20, status } = query;

    return this.ordersService.findBySupplier(
      supplierId,
      req.tenantId,
      req.userId,
      req.userRole,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(
      id,
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req: any,
  ) {
    return this.ordersService.update(
      id,
      updateOrderDto,
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: any,
  ) {
    return this.ordersService.updateStatus(
      id,
      body.status,
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.remove(
      id,
      req.tenantId,
      req.userId,
      req.userRole,
    );
  }
}
