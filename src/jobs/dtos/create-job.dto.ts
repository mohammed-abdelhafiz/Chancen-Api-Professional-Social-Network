import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsString()
  @MaxLength(100)
  company: string;

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
}
