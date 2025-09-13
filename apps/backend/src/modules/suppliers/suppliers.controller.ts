import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from '../../common/schemas/supplier.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: 201,
    description: 'Supplier created successfully',
    type: Supplier,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate supplier code',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() createSupplierDto: CreateSupplierDto,
    @Request() req: any,
  ): Promise<Supplier> {
    return this.suppliersService.create(createSupplierDto, req.user?.tenantId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get all suppliers with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for name, code, or email',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by supplier category',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by supplier status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field (default: supplierName)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order: asc or desc (default: asc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Suppliers retrieved successfully',
    type: [Supplier],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(@Query() query: any, @Request() req: any): Promise<{ suppliers: Supplier[]; total: number }> {
    return this.suppliersService.findAll(query, req.user?.tenantId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get supplier statistics and analytics' })
  @ApiResponse({
    status: 200,
    description: 'Supplier statistics retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getStats(): Promise<any> {
    return this.suppliersService.getSupplierStats();
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Search suppliers by term' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [Supplier],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing search term',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async searchSuppliers(@Query('q') searchTerm: string): Promise<Supplier[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }
    return this.suppliersService.searchSuppliers(searchTerm.trim());
  }

  @Get('category/:category')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get suppliers by category' })
  @ApiParam({ name: 'category', description: 'Supplier category' })
  @ApiResponse({
    status: 200,
    description: 'Suppliers by category retrieved successfully',
    type: [Supplier],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async getByCategory(
    @Param('category') category: string,
  ): Promise<Supplier[]> {
    return this.suppliersService.getSuppliersByCategory(category);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier retrieved successfully',
    type: Supplier,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid ID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findOne(@Param('id') id: string): Promise<Supplier> {
    return this.suppliersService.findOne(id);
  }

  @Get('code/:supplierCode')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get supplier by supplier code' })
  @ApiParam({ name: 'supplierCode', description: 'Supplier code' })
  @ApiResponse({
    status: 200,
    description: 'Supplier retrieved successfully',
    type: Supplier,
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findByCode(
    @Param('supplierCode') supplierCode: string,
  ): Promise<Supplier> {
    return this.suppliersService.findByCode(supplierCode);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully',
    type: Supplier,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or duplicate supplier code',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Patch(':id/rating')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update supplier rating' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rating: { type: 'number', minimum: 0, maximum: 5 },
        qualityRating: { type: 'number', minimum: 0, maximum: 5 },
        reliabilityScore: { type: 'number', minimum: 0, maximum: 5 },
      },
      required: ['rating'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier rating updated successfully',
    type: Supplier,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid rating values',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async updateRating(
    @Param('id') id: string,
    @Body()
    ratingData: {
      rating: number;
      qualityRating?: number;
      reliabilityScore?: number;
    },
  ): Promise<Supplier> {
    return this.suppliersService.updateSupplierRating(
      id,
      ratingData.rating,
      ratingData.qualityRating,
      ratingData.reliabilityScore,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  @ApiResponse({
    status: 204,
    description: 'Supplier deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid ID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.suppliersService.remove(id);
  }
}
