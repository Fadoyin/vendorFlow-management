import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../../common/email/email.module';
import { Supplier, SupplierSchema } from '../../common/schemas/supplier.schema';
import { Vendor, VendorSchema } from '../../common/schemas/vendor.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './services/otp.service';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    ConfigModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
      { name: Vendor.name, schema: VendorSchema }
    ]),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 3,
    }, {
      name: 'medium',
      ttl: 10000,
      limit: 20
    }, {
      name: 'long',
      ttl: 60000,
      limit: 100
    }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret =
          configService.get<string>('JWT_SECRET') || 'fallback-secret-change-in-production';
        console.log(
          'Auth Module - JWT Secret loaded:',
          secret ? 'EXISTS' : 'MISSING',
        );
        return {
          secret: secret,
          signOptions: { 
            expiresIn: '15m', // Short-lived access tokens
            issuer: 'vendorflow-api',
            audience: 'vendorflow-app'
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, OtpService],
  exports: [AuthService, JwtModule, JwtStrategy, OtpService],
})
export class AuthModule {}
