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
import { AuthGuard } from '@nestjs/passport';
import { currentUser } from './decorators/current-user.decorator';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';

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

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@currentUser() user: UserResponseDto) {
    return user;
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
