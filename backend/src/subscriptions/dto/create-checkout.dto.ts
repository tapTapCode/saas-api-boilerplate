import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'org-123' })
  @IsString()
  organizationId: string;

  @ApiProperty({ example: 'price_starter' })
  @IsString()
  priceId: string;
}
