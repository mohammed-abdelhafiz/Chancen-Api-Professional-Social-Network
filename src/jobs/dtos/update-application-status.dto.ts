import { IsEnum } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsEnum(['pending', 'accepted', 'rejected'])
  status: 'pending' | 'accepted' | 'rejected';
}
