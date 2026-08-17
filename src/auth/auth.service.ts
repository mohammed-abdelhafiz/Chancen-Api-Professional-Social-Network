import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import { UserResponseDto } from 'src/users/dtos/user-response.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
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
    const access_token = await this.generateToken(
      {
        sub: newUser.id,
        email: newUser.email,
      },
      {
        expiresIn: this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN'),
        secret: this.configService.getOrThrow('ACCESS_TOKEN_SECRET'),
      },
    );
    const refresh_token = await this.generateToken(
      {
        sub: newUser.id,
        email: newUser.email,
      },
      {
        expiresIn: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
        secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
      },
    );

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
    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }
    const isPasswordMatch = await this.comparePassword(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('invalid credentials');
    }
    const access_token = await this.generateToken(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN'),
        secret: this.configService.getOrThrow('ACCESS_TOKEN_SECRET'),
      },
    );

    const refresh_token = await this.generateToken(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
        secret: this.configService.getOrThrow('REFRESH_TOKEN_SECRET'),
      },
    );
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

  private hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
  private comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  private hashRefreshToken(refresh_token: string) {
    return createHash('sha256').update(refresh_token).digest('hex');
  }

  private generateToken(
    payload: { sub: string; email: string },
    options: JwtSignOptions,
  ) {
    return this.jwtService.signAsync(payload, options);
  }
}
