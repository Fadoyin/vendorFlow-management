import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.AWS_REGION = 'us-east-1';
  process.env.S3_BUCKET_NAME = 'test-bucket';
});

// Global test teardown
afterAll(async () => {
  // Clean up any global test resources
});

// Helper function to create testing module
export async function createTestingModule(
  imports: any[] = [],
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.test', '.env'],
      }),
      ...imports,
    ],
  }).compile();
}
