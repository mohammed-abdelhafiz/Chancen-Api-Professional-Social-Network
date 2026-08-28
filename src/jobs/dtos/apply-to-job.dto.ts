import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApplyToJobDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  coverLetter?: string;
}
