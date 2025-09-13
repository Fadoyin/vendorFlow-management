import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Body,
  Delete,
  Param,
  Get,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { UserRole } from '../../modules/users/schemas/user.schema';
import {
  UploadService,
  UploadedFile as UploadedFileInterface,
} from './upload.service';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Folder to upload to (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @Roles(UserRole.ADMIN,   UserRole.VENDOR)
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadedFileInterface> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.uploadService.uploadFile(file, folder);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Roles(UserRole.ADMIN)
  async deleteFile(@Param('key') key: string): Promise<{ message: string }> {
    await this.uploadService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  @Get(':key/url')
  @ApiOperation({ summary: 'Get signed URL for file access' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'URL expiration time in seconds (default: 3600)',
  })
  @Roles(UserRole.ADMIN,   UserRole.VENDOR)
  async getFileUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<{ url: string }> {
    const expirationTime = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.uploadService.getFileUrl(key, expirationTime);
    return { url };
  }

  @Get('list')
  @ApiOperation({ summary: 'List files in a folder' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description: 'Folder prefix to list',
  })
  @ApiQuery({
    name: 'maxKeys',
    required: false,
    description: 'Maximum number of files to return (default: 100)',
  })
  @Roles(UserRole.ADMIN)
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: string,
  ): Promise<{ files: any[] }> {
    const maxKeysNumber = maxKeys ? parseInt(maxKeys, 10) : 100;
    const files = await this.uploadService.listFiles(prefix, maxKeysNumber);
    return { files };
  }

  @Get(':key/metadata')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({
    status: 200,
    description: 'File metadata retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Roles(UserRole.ADMIN)
  async getFileMetadata(@Param('key') key: string): Promise<any> {
    return await this.uploadService.getFileMetadata(key);
  }

  @Post(':key/copy')
  @ApiOperation({ summary: 'Copy a file to a new location' })
  @ApiResponse({ status: 200, description: 'File copied successfully' })
  @ApiResponse({ status: 404, description: 'Source file not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        destinationKey: {
          type: 'string',
          description: 'Destination key for the copied file',
        },
      },
      required: ['destinationKey'],
    },
  })
  @Roles(UserRole.ADMIN)
  async copyFile(
    @Param('key') sourceKey: string,
    @Body('destinationKey') destinationKey: string,
  ): Promise<{ message: string }> {
    await this.uploadService.copyFile(sourceKey, destinationKey);
    return { message: 'File copied successfully' };
  }
}
