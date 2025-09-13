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
  UseInterceptors,
  UploadedFile,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new BadRequestException('User context not found');
    }
    return this.usersService.findById(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user;
    if (!user || !user.sub) {
      throw new BadRequestException('User context not found');
    }
    return this.usersService.update(user.sub, updateUserDto, user.tenantId);
  }

  @Post('profile/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password or validation failed' })
  async changeCurrentUserPassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    // Mock user context for testing - in real app this would come from JWT
    const mockUser = {
      sub: '68bbbfddb7d48608b5fa3351', // Supplier ID from database
      email: 'supplier@test.com',
      role: 'supplier',
      tenantId: '68bbbfddb7d48608b5fa3350', // Tenant ID from database
    };
    
    const user = req.user || mockUser;
    await this.usersService.changePassword(user.sub, body.currentPassword, body.newPassword, user.tenantId);
    return { message: 'Password changed successfully' };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Query() query: any, @Request() req) {
    return this.usersService.findAll(req.tenantId, query);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total user count' })
  @ApiResponse({
    status: 200,
    description: 'User count retrieved successfully',
  })
  getCount(@Request() req) {
    return this.usersService.getUsersCount(req.tenantId);
  }

  @Get('by-role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  getByRole(@Param('role') role: string, @Request() req) {
    return this.usersService.getUsersByRole(req.tenantId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete last admin' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.tenantId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  deactivate(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivateUser(id, req.tenantId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  activate(@Param('id') id: string, @Request() req) {
    return this.usersService.activateUser(id, req.tenantId);
  }

  @Post(':id/profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully',
  })
  uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    return this.usersService.updateProfilePicture(id, file, req.tenantId);
  }

  @Post(':id/change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid old password' })
  changePassword(
    @Param('id') id: string,
    @Body() body: { oldPassword: string; newPassword: string },
    @Request() req,
  ) {
    return this.usersService.changePassword(
      id,
      body.oldPassword,
      body.newPassword,
      req.tenantId,
    );
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resetPassword(@Body() body: { email: string }, @Request() req) {
    return this.usersService.resetPassword(body.email, req.tenantId);
  }

  @Get('admin/dashboard-stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get comprehensive admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard statistics retrieved successfully',
  })
  async getAdminDashboardStats(@Request() req: any): Promise<any> {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }
    return this.usersService.getAdminDashboardStats(tenantId);
  }
}
