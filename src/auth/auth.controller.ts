import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { AuthService } from './auth.service';
import { CookieOptions, type Response } from 'express';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } =
      await this.authService.register(dto);
    this.setTokenInCookie(
      'access_token',
      access_token,
      {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 15 * 60 * 1000,
      },
      res,
    );
    this.setTokenInCookie(
      'refresh_token',
      refresh_token,
      {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
      res,
    );
    return user;
  }
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } =
      await this.authService.login(dto);
    this.setTokenInCookie(
      'access_token',
      access_token,
      {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 15 * 60 * 1000,
      },
      res,
    );
    this.setTokenInCookie(
      'refresh_token',
      refresh_token,
      {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
      res,
    );
    return user;
  }

  private setTokenInCookie(
    name: string,
    token: string,
    options: CookieOptions,
    res: Response,
  ) {
    res.cookie(name, token, options);
  }
}
