// Shared configuration for VendorFlow
import { config } from 'dotenv';

// Load environment variables
config();

export const CONFIG = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/vendorflow',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // API
  API_PORT: parseInt(process.env.API_PORT || '3001', 10),
  API_PREFIX: process.env.API_PREFIX || 'api',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // ML Service
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  
  // AWS
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
} as const;

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test'; 