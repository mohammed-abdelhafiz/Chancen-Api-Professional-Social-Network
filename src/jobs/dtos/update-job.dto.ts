import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  company?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @IsEnum(['full_time', 'part_time', 'contract', 'internship', 'remote'])
  @IsOptional()
  type?: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  salary?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  benefits?: string;

  @IsEnum(['open', 'closed', 'draft'])
  @IsOptional()
  status?: 'open' | 'closed' | 'draft';
}
