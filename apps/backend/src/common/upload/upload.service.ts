import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadedFile {
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
    });
    this.bucketName = this.configService.get<string>(
      'AWS_S3_BUCKET',
      'vendor-management-files',
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    allowedTypes: string[] = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  ): Promise<UploadedFile> {
    try {
      // Validate file type
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} is not allowed`,
        );
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 10MB limit');
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${filename}`;

      // Upload to S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: 'system',
          uploadedAt: new Date().toISOString(),
        },
      };

      const result = await this.s3.upload(uploadParams).promise();

      const uploadedFile: UploadedFile = {
        originalname: file.originalname,
        filename: filename,
        mimetype: file.mimetype,
        size: file.size,
        url: result.Location,
        key: key,
      };

      this.logger.log(`File uploaded successfully: ${filename}`);
      return uploadedFile;
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      throw error;
    }
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`);
      throw error;
    }
  }

  async listFiles(
    prefix: string = '',
    maxKeys: number = 100,
  ): Promise<S3.Object[]> {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const copyParams = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      };

      await this.s3.copyObject(copyParams).promise();
      this.logger.log(
        `File copied successfully from ${sourceKey} to ${destinationKey}`,
      );
    } catch (error) {
      this.logger.error(`File copy failed: ${error.message}`);
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<S3.HeadObjectOutput> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      return await this.s3.headObject(params).promise();
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${error.message}`);
      throw error;
    }
  }
}
