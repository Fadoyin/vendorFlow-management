import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor } from '../../common/schemas/vendor.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

@ApiTags('vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({
    status: 201,
    description: 'Vendor created successfully',
    type: Vendor,
  })
  async create(
    @Body() createVendorDto: CreateVendorDto,
    @Request() req: any,
  ): Promise<Vendor> {
    const tenantId = req.tenantId;
    const userId = req.userId;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }
    return this.vendorsService.create(createVendorDto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({
    status: 200,
    description: 'List of vendors retrieved successfully',
    type: [Vendor],
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc/desc)',
  })
  async findAll(
    @Query() query: any,
    @Request() req: any,
  ): Promise<{ vendors: Vendor[]; total: number }> {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }
    return this.vendorsService.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get vendor statistics' })
  @ApiResponse({
    status: 200,
    description: 'Vendor statistics retrieved successfully',
  })
  async getStats(@Request() req: any): Promise<any> {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }
    return this.vendorsService.getVendorStats(tenantId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get vendor dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Vendor dashboard data retrieved successfully',
  })
  async getDashboard(@Request() req: any): Promise<any> {
    const userId = req.userId;
    const tenantId = req.tenantId;
    
    if (!userId || !tenantId) {
      throw new BadRequestException('User context not found');
    }
    
    return this.vendorsService.getVendorDashboard(userId, tenantId);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get vendor orders with stats' })
  @ApiResponse({
    status: 200,
    description: 'Vendor orders retrieved successfully',
  })
  async getVendorOrders(@Query() query: any, @Request() req: any): Promise<any> {
    const userId = req.userId;
    const tenantId = req.tenantId;
    
    if (!userId || !tenantId) {
      throw new BadRequestException('User context not found');
    }
    
    return this.vendorsService.getVendorOrders(userId, tenantId, query);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get vendor forecast data' })
  @ApiResponse({
    status: 200,
    description: 'Vendor forecast data retrieved successfully',
  })
  @ApiQuery({ name: 'period', required: false, description: 'Forecast period (1month, 3months, 6months, 1year)' })
  @ApiQuery({ name: 'metric', required: false, description: 'Forecast metric (revenue, orders, customers)' })
  async getVendorForecast(
    @Query('period') period: string = '3months',
    @Query('metric') metric: string = 'revenue',
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user?.sub || req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      throw new BadRequestException('User context not found');
    }
    
    return this.vendorsService.getVendorForecast(userId, tenantId, period, metric);
  }

  @Post('forecast/generate')
  @ApiOperation({ summary: 'Generate new vendor forecast' })
  @ApiResponse({
    status: 200,
    description: 'Forecast generated successfully',
  })
  @ApiQuery({ name: 'period', required: false, description: 'Forecast period (1month, 3months, 6months, 1year)' })
  async generateVendorForecast(
    @Query('period') period: string = '3months',
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user?.sub || req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      throw new BadRequestException('User context not found');
    }
    
    return this.vendorsService.generateVendorForecast(userId, tenantId, period);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get vendor payment dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Payment dashboard data retrieved successfully',
  })
  async getVendorPayments(
    @Request() req: any,
  ): Promise<any> {
    const userId = req.user?.sub || req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      throw new BadRequestException('User context not found');
    }
    
    return this.vendorsService.getVendorPayments(userId, tenantId);
  }

  @Get('payments/transactions')
  @ApiOperation({ summary: 'Get vendor payment transactions' })
  @ApiResponse({
    status: 200,
    description: 'Payment transactions retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async getVendorPaymentTransactions(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
  ): Promise<any> {
    const userId = req.user?.sub || req.user?.id;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      throw new BadRequestException('User context not found');
    }
    
    return this.vendorsService.getVendorPaymentTransactions(userId, tenantId, { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor retrieved successfully',
    type: Vendor,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<Vendor> {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }
    
    const vendor = await this.vendorsService.findOne(id, tenantId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return vendor;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated successfully',
    type: Vendor,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @Request() req: any,
  ): Promise<Vendor> {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.sub;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }
    
    const vendor = await this.vendorsService.update(id, updateVendorDto, tenantId, userId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return vendor;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.sub;
    if (!tenantId || !userId) {
      throw new BadRequestException('User context not found');
    }
    
    try {
      await this.vendorsService.remove(id, tenantId, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }
      throw error;
    }
  }
}
