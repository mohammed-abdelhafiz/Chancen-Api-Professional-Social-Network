import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  register(dto: RegisterDto) {
    return dto;
  }
}
