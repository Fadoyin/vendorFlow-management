import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    console.log('JWT Strategy - Secret loaded:', secret ? 'EXISTS' : 'MISSING');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email || !payload.role || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload - missing required fields');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      companyName: payload.companyName,
    };
  }
}
