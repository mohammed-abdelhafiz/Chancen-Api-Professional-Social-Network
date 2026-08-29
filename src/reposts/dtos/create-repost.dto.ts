import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRepostDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  content?: string;
}
