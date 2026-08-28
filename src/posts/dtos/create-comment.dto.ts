import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  content?: string;
}
