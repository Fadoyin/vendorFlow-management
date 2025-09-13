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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrder } from './schemas/purchase-order.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@ApiTags('purchase-orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created successfully',
    type: PurchaseOrder,
  })
  async create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.create(
      createPurchaseOrderDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all purchase orders with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase orders retrieved successfully',
  })
  async findAll(
    @Query() query: any,
    @Request() req: any,
  ): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
    return this.purchaseOrdersService.findAll(req.user.tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get purchase order statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(@Request() req: any): Promise<any> {
    return this.purchaseOrdersService.getPurchaseOrderStats(req.user.tenantId);
  }

  @Get('number/:poNumber')
  @ApiOperation({ summary: 'Get purchase order by PO number' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order retrieved successfully',
    type: PurchaseOrder,
  })
  async findByPoNumber(
    @Param('poNumber') poNumber: string,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.findByPONumber(
      poNumber,
      req.user.tenantId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order retrieved successfully',
    type: PurchaseOrder,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order updated successfully',
    type: PurchaseOrder,
  })
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.update(
      id,
      updatePurchaseOrderDto,
      req.user.tenantId,
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit purchase order for approval' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order submitted for approval',
    type: PurchaseOrder,
  })
  async submitForApproval(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.submitForApproval(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post(':id/approve/:approvalId')
  @ApiOperation({ summary: 'Approve or reject purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Approval updated successfully',
    type: PurchaseOrder,
  })
  async approve(
    @Param('id') id: string,
    @Param('approvalId') approvalId: string,
    @Body() approvalData: { status: string; comments?: string },
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.approve(
      id,
      approvalId,
      approvalData.status,
      req.user.tenantId,
    );
  }

  @Post(':id/send-to-vendor')
  @ApiOperation({ summary: 'Send approved purchase order to vendor' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order sent to vendor',
    type: PurchaseOrder,
  })
  async sendToVendor(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.sendToVendor(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive items from purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Items received successfully',
    type: PurchaseOrder,
  })
  async receiveItems(
    @Param('id') id: string,
    @Body()
    receiptData: {
      itemId: string;
      quantity: number;
      receivedDate: string;
      condition: string;
      notes?: string;
    }[],
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.receiveItems(
      id,
      req.user.tenantId,
      req.user.userId,
      receiptData,
    );
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close completed purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order closed successfully',
    type: PurchaseOrder,
  })
  async close(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrdersService.close(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiResponse({
    status: 200,
    description: 'Purchase order deleted successfully',
  })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.purchaseOrdersService.remove(id, req.user.tenantId);
  }
}
