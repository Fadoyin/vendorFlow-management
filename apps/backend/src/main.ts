import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Custom middleware to handle CORS content-type issues
  app.use('/api/inventory', (req, res, next) => {
    if (
      req.method === 'POST' &&
      req.headers['content-type'] === 'text/plain;charset=UTF-8'
    ) {
      logger.debug('=== CORS CONTENT-TYPE FIX ===');
      logger.debug('Original content-type:', req.headers['content-type']);
      req.headers['content-type'] = 'application/json';
      logger.debug('Fixed content-type:', req.headers['content-type']);
    }
    next();
  });

  // Body parser middleware - must come before other middleware
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Enhanced security middleware
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  app.use(compression());

  // Enhanced CORS configuration
  const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3003',
    'http://localhost:3005',
    // Add production origins here
  ];

  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With',
      'Cache-Control'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 3600, // Cache preflight for 1 hour
  });

  // Enhanced global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed validation errors in production
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('VendorFlow API')
    .setDescription('Comprehensive Vendor Management System API with advanced security features')
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Vendors', 'Vendor management')
    .addTag('Suppliers', 'Supplier management')
    .addTag('Orders', 'Order management')
    .addTag('Inventory', 'Inventory management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 VendorFlow API Server running on port ${port}`);
  logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🔒 Security features enabled: Rate limiting, CORS, Helmet, Validation`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application:', error);
  process.exit(1);
});
