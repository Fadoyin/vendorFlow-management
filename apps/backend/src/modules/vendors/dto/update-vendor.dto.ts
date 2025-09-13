import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @ApiPropertyOptional({
    description: 'Vendor status',
    enum: ['active', 'inactive', 'suspended', 'blacklisted'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended', 'blacklisted'])
  status?: string;
}
