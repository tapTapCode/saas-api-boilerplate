import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateApiKeyDto {
  @ApiProperty({ example: 'Production API Key', required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
