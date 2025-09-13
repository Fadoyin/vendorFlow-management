import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private s3: AWS.S3;
  private cognito: AWS.CognitoIdentityServiceProvider;
  private region: string;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    // Initialize with default values, will be configured on first use
    this.region = 'us-east-1';
    this.bucketName = 'vendor-management-documents';

    // Initialize AWS services with default config
    this.s3 = new AWS.S3();
    this.cognito = new AWS.CognitoIdentityServiceProvider();
  }

  private initializeAwsConfig() {
    if (!this.s3 || !this.cognito) {
      this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
      this.bucketName = this.configService.get<string>(
        'S3_BUCKET_NAME',
        'vendor-management-documents',
      );

      // Configure AWS SDK
      AWS.config.update({
        region: this.region,
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      });
    }
  }

  // S3 Operations
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    metadata?: Record<string, string>,
  ): Promise<{ key: string; url: string }> {
    try {
      this.initializeAwsConfig();

      const key = `${folder}/${uuidv4()}-${file.originalname}`;

      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: metadata || {},
        ACL: 'private',
      };

      const result = await this.s3.upload(uploadParams).promise();

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key: result.Key,
        url: result.Location,
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, _expiresIn: number = 3600): Promise<string> {
    try {
      const params: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        // Expires: expiresIn, // Not supported in GetObjectRequest
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async listFiles(prefix: string): Promise<AWS.S3.Object[]> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucketName,
        Prefix: prefix,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Cognito Operations
  async verifyToken(token: string): Promise<any> {
    try {
      const params: AWS.CognitoIdentityServiceProvider.GetUserRequest = {
        AccessToken: token,
      };

      const result = await this.cognito.getUser(params).promise();
      return result;
    } catch (error) {
      this.logger.error(`Error verifying token: ${error.message}`);
      throw new Error(`Invalid token: ${error.message}`);
    }
  }

  async getUserBySub(sub: string): Promise<any> {
    try {
      const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
      const params: AWS.CognitoIdentityServiceProvider.AdminGetUserRequest = {
        UserPoolId: userPoolId,
        Username: sub,
      };

      const result = await this.cognito.adminGetUser(params).promise();
      return result;
    } catch (error) {
      this.logger.error(`Error getting user by sub: ${error.message}`);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    attributes: Record<string, string>;
  }): Promise<any> {
    try {
      const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
      const params: AWS.CognitoIdentityServiceProvider.AdminCreateUserRequest =
        {
          UserPoolId: userPoolId,
          Username: userData.email,
          UserAttributes: Object.entries(userData.attributes).map(
            ([key, value]) => ({
              Name: key,
              Value: value,
            }),
          ),
          TemporaryPassword: userData.password,
          MessageAction: 'SUPPRESS',
        };

      const result = await this.cognito.adminCreateUser(params).promise();
      return result;
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateUserAttributes(
    sub: string,
    attributes: Record<string, string>,
  ): Promise<void> {
    try {
      const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
      const params: AWS.CognitoIdentityServiceProvider.AdminUpdateUserAttributesRequest =
        {
          UserPoolId: userPoolId,
          Username: sub,
          UserAttributes: Object.entries(attributes).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        };

      await this.cognito.adminUpdateUserAttributes(params).promise();
      this.logger.log(`User attributes updated successfully: ${sub}`);
    } catch (error) {
      this.logger.error(`Error updating user attributes: ${error.message}`);
      throw new Error(`Failed to update user attributes: ${error.message}`);
    }
  }

  async deleteUser(sub: string): Promise<void> {
    try {
      const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
      const params: AWS.CognitoIdentityServiceProvider.AdminDeleteUserRequest =
        {
          UserPoolId: userPoolId,
          Username: sub,
        };

      await this.cognito.adminDeleteUser(params).promise();
      this.logger.log(`User deleted successfully: ${sub}`);
    } catch (error) {
      this.logger.error(`Error deleting user: ${error.message}`);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Utility Methods
  async generatePresignedPostUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<{ url: string; fields: any }> {
    try {
      const params: any = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
        Conditions: [
          ['content-length-range', 0, 10485760], // 10MB max
          ['starts-with', '$Content-Type', contentType],
        ],
        Fields: {
          'Content-Type': contentType,
        },
      };

      const result = await this.s3.createPresignedPost(params);
      return result;
    } catch (error) {
      this.logger.error(
        `Error generating presigned POST URL: ${error.message}`,
      );
      throw new Error(
        `Failed to generate presigned POST URL: ${error.message}`,
      );
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const params: AWS.S3.CopyObjectRequest = {
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
        ACL: 'private',
      };

      await this.s3.copyObject(params).promise();
      this.logger.log(
        `File copied successfully: ${sourceKey} -> ${destinationKey}`,
      );
    } catch (error) {
      this.logger.error(`Error copying file: ${error.message}`);
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
      };

      const result = await this.s3.headObject(params).promise();
      return result;
    } catch (error) {
      this.logger.error(`Error getting file metadata: ${error.message}`);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}
