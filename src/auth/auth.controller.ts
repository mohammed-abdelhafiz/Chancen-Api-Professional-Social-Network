import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { AuthService } from './auth.service';
import { type Request, type Response } from 'express';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { GoogleUser } from './types/google-user.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } =
      await this.authService.register(dto);
    this.sendAccessToken(access_token, res);
    this.sendRefreshToken(refresh_token, res);
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
    this.sendAccessToken(access_token, res);
    this.sendRefreshToken(refresh_token, res);
    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token as string;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return {
      message: 'Logged out successfully',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshAccessToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string;
    const { newAccessToken, newRefreshToken } =
      await this.authService.refresh(refreshToken);
    this.sendAccessToken(newAccessToken, res);
    this.sendRefreshToken(newRefreshToken, res);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  loginWithGoogle() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.googleLogin(
      req.user as GoogleUser,
    );

    this.sendAccessToken(access_token, res);
    this.sendRefreshToken(refresh_token, res);

    return res.redirect(this.configService.getOrThrow('CLIENT_URL'));
  }

  private sendAccessToken(token: string, res: Response) {
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 15 * 60 * 1000,
    });
  }
  private sendRefreshToken(token: string, res: Response) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });
  }
}
