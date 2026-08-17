import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }
  findById(id: string) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  create(user: Prisma.UserCreateInput) {
    return this.prismaService.user.create({ data: user });
  }

  addGoogleId(userId: string, googleId: string) {
    return this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        googleId,
      },
    });
  }

  async updateProfile(user: UserResponseDto, dto: UpdateProfileDto) {
    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: dto,
    });

    return new UserResponseDto(updatedUser);
  }
}
