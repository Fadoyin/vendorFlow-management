export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  tenantId: string;
  companyName?: string;
  vendorProfile?: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
  jti?: string; // JWT ID for token revocation
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  email: string;
  tokenFamily: string; // For refresh token rotation
  jti: string; // JWT ID for token revocation
  iat?: number;
  exp?: number;
}
