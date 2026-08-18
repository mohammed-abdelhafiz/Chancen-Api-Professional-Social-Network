import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { Prisma } from 'generated/prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
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
  async updateProfile(
    user: UserResponseDto,
    dto: UpdateProfileDto,
    files: {
      avatar?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
      resume?: Express.Multer.File[];
    },
  ) {
    const data: Prisma.UserUpdateInput = {
      ...dto,
    };

    if (files.avatar?.[0]) {
      const oldAvatar = user?.avatar as {
        url?: string;
        publicId?: string;
        resourceType?: 'image' | 'raw';
      };

      if (oldAvatar?.publicId) {
        await this.cloudinaryService.deleteFile(
          oldAvatar.publicId,
          oldAvatar.resourceType ?? 'image',
        );
      }
      const result = await this.cloudinaryService.uploadFile(
        files.avatar[0],
        'chancen/users/avatars',
        'image',
      );

      data.avatar = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    if (files.coverPhoto?.[0]) {
      const oldCoverPhoto = user?.coverPhoto as {
        url?: string;
        publicId?: string;
        resourceType?: 'image' | 'raw';
      };

      if (oldCoverPhoto?.publicId) {
        await this.cloudinaryService.deleteFile(
          oldCoverPhoto.publicId,
          oldCoverPhoto.resourceType ?? 'image',
        );
      }
      const result = await this.cloudinaryService.uploadFile(
        files.coverPhoto[0],
        'chancen/users/covers',
        'image',
      );

      data.coverPhoto = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    if (files.resume?.[0]) {
      const oldResume = user?.resume as {
        url?: string;
        publicId?: string;
        resourceType?: 'image' | 'raw';
      };

      if (oldResume?.publicId) {
        await this.cloudinaryService.deleteFile(
          oldResume.publicId,
          oldResume.resourceType ?? 'image',
        );
      }
      const result = await this.cloudinaryService.uploadFile(
        files.resume[0],
        'chancen/users/resumes',
        'image',
      );
      data.resume = {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data,
    });
    return new UserResponseDto(updatedUser);
  }
}
