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
import { ForecastsService } from './forecasts.service';
import { CreateForecastDto } from './dto/create-forecast.dto';
import { UpdateForecastDto } from './dto/update-forecast.dto';
import { CostForecastInputDto, CostForecastResultDto } from './dto/cost-forecast.dto';
import { InventoryForecastInputDto, InventoryForecastResultDto } from './dto/inventory-forecast.dto';
import { DemandForecastInputDto, DemandForecastResultDto } from './dto/demand-forecast.dto';
import { Forecast } from '../../common/schemas/forecast.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@ApiTags('forecasts')
@Controller('forecasts')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new forecast' })
  @ApiResponse({
    status: 201,
    description: 'Forecast created successfully',
    type: Forecast,
  })
  async create(
    @Body() createForecastDto: CreateForecastDto,
    @Request() req: any,
  ): Promise<Forecast> {
    return this.forecastsService.create(
      createForecastDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all forecasts with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Forecasts retrieved successfully' })
  async findAll(
    @Query() query: any,
    @Request() req: any,
  ): Promise<{ forecasts: Forecast[]; total: number }> {
    return this.forecastsService.findAll(req.user.tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get forecast statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(@Request() req: any): Promise<any> {
    return this.forecastsService.getForecastStats(req.user.tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active forecasts' })
  @ApiResponse({
    status: 200,
    description: 'Active forecasts retrieved successfully',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by forecast type',
  })
  async getActiveForecasts(
    @Query('type') type: string,
    @Request() req: any,
  ): Promise<Forecast[]> {
    return this.forecastsService.getActiveForecasts(req.user.tenantId, type);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search forecasts' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum results to return',
  })
  async searchForecasts(
    @Query('q') searchTerm: string,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ): Promise<Forecast[]> {
    return this.forecastsService.searchForecasts(
      req.user.tenantId,
      searchTerm,
      limit,
    );
  }

  @Get('id/:forecastId')
  @ApiOperation({ summary: 'Get forecast by forecast ID' })
  @ApiResponse({
    status: 200,
    description: 'Forecast retrieved successfully',
    type: Forecast,
  })
  async findByForecastId(
    @Param('forecastId') forecastId: string,
    @Request() req: any,
  ): Promise<Forecast> {
    return this.forecastsService.findByForecastId(
      forecastId,
      req.user.tenantId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get forecast by ID' })
  @ApiResponse({
    status: 200,
    description: 'Forecast retrieved successfully',
    type: Forecast,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Forecast> {
    return this.forecastsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a forecast' })
  @ApiResponse({
    status: 200,
    description: 'Forecast updated successfully',
    type: Forecast,
  })
  async update(
    @Param('id') id: string,
    @Body() updateForecastDto: UpdateForecastDto,
    @Request() req: any,
  ): Promise<Forecast> {
    return this.forecastsService.update(
      id,
      updateForecastDto,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a forecast' })
  @ApiResponse({
    status: 200,
    description: 'Forecast activated successfully',
    type: Forecast,
  })
  async activate(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Forecast> {
    return this.forecastsService.activate(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a forecast' })
  @ApiResponse({
    status: 200,
    description: 'Forecast deactivated successfully',
    type: Forecast,
  })
  async deactivate(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Forecast> {
    return this.forecastsService.deactivate(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a forecast' })
  @ApiResponse({ status: 200, description: 'Forecast deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.forecastsService.remove(id, req.user.tenantId, req.user.userId);
  }

  // New Enhanced Forecasting Endpoints

  @Post('cost-forecast')
  @ApiOperation({ summary: 'Generate cost forecast with advanced analytics' })
  @ApiResponse({
    status: 201,
    description: 'Cost forecast generated successfully',
    type: CostForecastResultDto,
  })
  async generateCostForecast(
    @Body() costForecastDto: CostForecastInputDto,
    @Request() req: any,
  ): Promise<CostForecastResultDto> {
    return this.forecastsService.generateCostForecast(
      costForecastDto,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('inventory-forecast')
  @ApiOperation({ summary: 'Generate inventory forecast with reorder recommendations' })
  @ApiResponse({
    status: 201,
    description: 'Inventory forecast generated successfully',
    type: InventoryForecastResultDto,
  })
  async generateInventoryForecast(
    @Body() inventoryForecastDto: InventoryForecastInputDto,
    @Request() req: any,
  ): Promise<InventoryForecastResultDto> {
    return this.forecastsService.generateInventoryForecast(
      inventoryForecastDto,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('demand-forecast')
  @ApiOperation({ summary: 'Generate advanced demand forecast with ML models' })
  @ApiResponse({
    status: 201,
    description: 'Demand forecast generated successfully',
    type: DemandForecastResultDto,
  })
  async generateDemandForecast(
    @Body() demandForecastDto: DemandForecastInputDto,
    @Request() req: any,
  ): Promise<DemandForecastResultDto> {
    return this.forecastsService.generateDemandForecast(
      demandForecastDto,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get('cost-forecast/:id')
  @ApiOperation({ summary: 'Get cost forecast by ID' })
  @ApiResponse({
    status: 200,
    description: 'Cost forecast retrieved successfully',
    type: CostForecastResultDto,
  })
  async getCostForecast(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<CostForecastResultDto> {
    return this.forecastsService.getCostForecast(
      id,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get('inventory-forecast/:id')
  @ApiOperation({ summary: 'Get inventory forecast by ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory forecast retrieved successfully',
    type: InventoryForecastResultDto,
  })
  async getInventoryForecast(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<InventoryForecastResultDto> {
    return this.forecastsService.getInventoryForecast(
      id,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
  }

  @Get('demand-forecast/:id')
  @ApiOperation({ summary: 'Get demand forecast by ID' })
  @ApiResponse({
    status: 200,
    description: 'Demand forecast retrieved successfully',
    type: DemandForecastResultDto,
  })
  async getDemandForecast(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<DemandForecastResultDto> {
    return this.forecastsService.getDemandForecast(
      id,
      req.user.tenantId,
      req.user.userId,
      req.user.role,
    );
  }
}
