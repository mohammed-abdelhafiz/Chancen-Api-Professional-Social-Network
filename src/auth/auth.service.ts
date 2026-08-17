import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { createHash } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const { firstName, lastName, email, password } = dto;
    const user = await this.usersService.findByEmail(email);
    if (user) {
      throw new ConflictException('Account already exists, Try to login');
    }
    const hashedPassword = await this.hashPassword(password);
    const newUser = await this.usersService.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    const access_token = await this.generateAccessToken({
      sub: newUser.id,
      email: newUser.email,
    });
    const refresh_token = await this.generateRefreshToken({
      sub: newUser.id,
      email: newUser.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const hashedRefreshToken = this.hashRefreshToken(refresh_token);
    await this.prismaService.refreshToken.create({
      data: { tokenHash: hashedRefreshToken, userId: newUser.id, expiresAt },
    });
    return { user: new UserResponseDto(newUser), access_token, refresh_token };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('invalid credentials');
    }
    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('invalid credentials');
    }
    const access_token = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    const refresh_token = await this.generateRefreshToken({
      sub: user.id,
      email: user.email,
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const hashedRefreshToken = this.hashRefreshToken(refresh_token);
    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });
    return { user: new UserResponseDto(user), access_token, refresh_token };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);

    await this.prismaService.refreshToken.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  async googleLogin(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }) {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      user = await this.usersService.create({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        googleId: profile.googleId,
        avatar: profile.picture,
      });
    }

    if (!user.googleId) {
      user = await this.usersService.addGoogleId(user.id, profile.googleId);
    }

    const access_token = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    const refresh_token = await this.generateRefreshToken({
      sub: user.id,
      email: user.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const hashedRefreshToken = this.hashRefreshToken(refresh_token);

    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: new UserResponseDto(user),
      access_token,
      refresh_token,
    };
  }

  async refresh(refreshToken: string) {
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const storedRefreshToken = await this.prismaService.refreshToken.findUnique(
      {
        where: { tokenHash: hashedRefreshToken },
      },
    );
    if (!storedRefreshToken) {
      throw new UnauthorizedException('invalid refresh token');
    }
    if (storedRefreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('expired refresh token');
    }
    const userId = storedRefreshToken.userId;
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('user not found');
    }
    const newAccessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
    });
    const newRefreshToken = await this.generateRefreshToken({
      sub: user.id,
      email: user.email,
    });

    await this.prismaService.refreshToken.update({
      where: { tokenHash: hashedRefreshToken },
      data: {
        tokenHash: this.hashRefreshToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { newAccessToken, newRefreshToken };
  }

  private hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
  private comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  private hashRefreshToken(refresh_token: string) {
    return createHash('sha256').update(refresh_token).digest('hex');
  }

  private generateAccessToken(payload: { sub: string; email: string }) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN'),
      secret: this.configService.getOrThrow('ACCESS_TOKEN_SECRET'),
    });
  }
  private generateRefreshToken(payload: { sub: string; email: string }) {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
      secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
    });
  }
}
